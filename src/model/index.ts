import { ChatOllama } from '@langchain/ollama'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatXAI } from '@langchain/xai'
import { ChatOpenAI } from '@langchain/openai'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { type TProviders } from '../schema'

export class Model {
  private static instance: Model | null = null
  private llm: ChatOllama | ChatAnthropic | ChatXAI
  private chain: RunnableSequence
  private finalSummary: RunnableSequence

  private constructor(provider: TProviders) {
    if (provider === 'anthropic') {
      this.llm = new ChatAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      })
    } else if (provider === 'xai') {
      this.llm = new ChatXAI({
        apiKey: process.env.XAI_API_KEY
      })
    } else if (provider === 'openai') {
      this.llm = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    } else {
      this.llm = new ChatOllama({
        baseUrl: 'http://localhost:11434',
        model: 'llama3.2'
      })
    }

    const identifierPrompt = ChatPromptTemplate.fromTemplate(`
      You are the world's best programming language classifier model. When you see code snippets form a
      git diff, you are able to tell what programming language/s are being used.

      Identify which languages are used in the following git diff text output from the terminal: {input}

      Respond with an array containing all the programming languages you identified with neither preamble nor explanation.
    `)

    const diffPrompt = ChatPromptTemplate.fromTemplate(`
      You are a senior software engineer who is good at reading git diffs and turning them into clear and concise yet precise commit messages.

      Generate a commit message given the following git diff text output from the terminal: {input}
      Programming languages identified: {languages}

      Respond with exactly the commit message that would best suit this diff with neither preamble nor explanation.
    `)

    const identifierChain = RunnableSequence.from([
      identifierPrompt,
      this.llm,
      new StringOutputParser()
    ])

    this.chain = RunnableSequence.from([
      input => ({ input }),
      {
        input: data => data.input,
        languages: identifierChain
      },
      diffPrompt,
      this.llm,
      new StringOutputParser()
    ])

    const finalSummaryPrompt = ChatPromptTemplate.fromTemplate(`
      You are a senior software engineer tasked to create a single one-sentence commit message out of a paragraph given to you that may consist of combined commit messages. No new lines or making the commit
      message in the style of a list, just one sentence.

      Generate said commit messages that capture the essence of the body of text: {input}

      Respond with exactly a one-sentence commit message with neither preamble nor explanation.
    `)

    this.finalSummary = RunnableSequence.from([
      input => ({ input }),
      finalSummaryPrompt,
      this.llm,
      new StringOutputParser()
    ])
  }

  private static getInstance(provider: TProviders): Model {
    if (!this.instance) {
      this.instance = new Model(provider)
    }

    return this.instance
  }

  static async summarize(input: string, provider: TProviders) {
    const model = this.getInstance(provider)
    const output = await model.chain.invoke(input)
    return output
  }

  static async *stream(input: string, provider: TProviders) {
    const model = this.getInstance(provider)
    const stream = await model.finalSummary.stream(input)

    for await (const chunk of stream) {
      yield chunk
    }
  }

  static async finalSummarization(input: string, provider: TProviders) {
    const model = this.getInstance(provider)

    // TODO: Can't get streaming to properly work yet for some reason - J
    if (provider === 'xai') {
      const response = await model.chain.invoke(input)
      console.log(response)
      return
    }

    const stream = await model.chain.stream(input)
    for await (const chunk of stream) {
      process.stdout.write(chunk)
    }

    process.stdout.write('\n')
  }

  static async getTokenLength(input: string, provider: TProviders) {
    const model = this.getInstance(provider)
    return await model.llm.getNumTokens(input)
  }
}
