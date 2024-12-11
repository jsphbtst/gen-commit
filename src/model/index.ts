import { ChatOllama } from '@langchain/ollama'
import { ChatAnthropic } from '@langchain/anthropic'
import { RunnableSequence } from '@langchain/core/runnables'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'

const USE_ANTHROPIC_DEFAULT = false

export class Model {
  private static instance: Model | null = null
  private llm: ChatOllama | ChatAnthropic
  private chain: RunnableSequence

  private constructor(useAnthropic: boolean = USE_ANTHROPIC_DEFAULT) {
    this.llm = useAnthropic
      ? new ChatAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        })
      : new ChatOllama({
          baseUrl: 'http://localhost:11434',
          model: 'llama3.2'
        })

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
  }

  private static getInstance(useAnthropic: boolean = USE_ANTHROPIC_DEFAULT): Model {
    if (!this.instance) {
      this.instance = new Model(useAnthropic)
    }

    return this.instance
  }

  static async *stream(input: string) {
    const model = this.getInstance()
    const stream = await model.chain.stream(input)

    for await (const chunk of stream) {
      yield chunk
    }
  }

  static async invoke(input: string, useAnthropic: boolean = USE_ANTHROPIC_DEFAULT) {
    const model = this.getInstance(useAnthropic)
    const stream = await model.chain.stream(input)

    for await (const chunk of stream) {
      process.stdout.write(chunk)
    }

    process.stdout.write('\n')
  }
}
