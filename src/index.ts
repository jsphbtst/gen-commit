import { $ } from 'bun'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Model } from './model'
import { MIN_DIFF_FILES } from './constants'
import { ArgsSchema, type TArgs, type TProviders } from './schema'

const rawArgs = yargs(hideBin(process.argv))
  .options({
    pwd: {
      type: 'string',
      describe: 'Current directory of git repo'
    },
    provider: {
      type: 'string',
      choices: ['ollama', 'anthropic', 'xai'],
      default: 'ollama',
      describe: 'AI model provider to use'
    }
  })
  .help()
  .strict()
  .parseSync() as TArgs

async function processGitFileDiff(
  file: string,
  directory: string,
  provider: TProviders
): Promise<string> {
  try {
    const diff = await $`git -C ${directory} diff ${file}`.text()
    console.log(`Summarizing diff for ${file}...`)
    const summary = await Model.summarize(diff.slice(0, 300), provider)
    return summary
  } catch (e) {
    console.error(e)
    return ''
  }
}

async function main() {
  const args = ArgsSchema.parse(rawArgs)
  const { pwd: directory, provider } = args

  try {
    const res = await $`git -C ${directory} rev-parse --is-inside-work-tree`.quiet()
    const isGitWorkTree = res.exitCode === 0
    if (!isGitWorkTree) {
      console.log('Project specified is not a git worktree.')
      process.exit(0)
    }
  } catch {
    console.log('Project specified is not a git worktree.')
    process.exit(0)
  }

  const diffFilesText = await $`git -C ${directory} diff --name-only`.text()
  const diffFiles = diffFilesText
    .trim()
    .split('\n')
    .filter(a => !!a?.length)
  if (diffFiles.length < MIN_DIFF_FILES) {
    console.log('No diffs to process')
    return
  }

  const summaryPromises: Promise<string>[] = []
  for (let idx = 0; idx < diffFiles.length; idx++) {
    const file = diffFiles[idx]
    summaryPromises.push(processGitFileDiff(file, directory, provider))
  }

  const summaries = await Promise.all(summaryPromises)
  const combinedSummaries = summaries.join('\n')

  console.log('Generating combined summaries...\n')
  await Model.finalSummarization(combinedSummaries, provider)
}

await main()
  .then(() => {})
  .catch(err => console.error(err))
  .finally(() => {})

export {}
