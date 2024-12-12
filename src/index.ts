import { $ } from 'bun'
import { Model } from './model'

async function main() {
  const directory = process.argv[3]

  const useAnthropicArg = process.argv[4]
  const useAnthropicInt =
    useAnthropicArg === '--use-anthropic' ? Number.parseInt(process.argv[5]) : 0
  const useAnthropic = Boolean(useAnthropicInt)

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
  const diffFiles = diffFilesText.trim().split('\n')

  const summaryPromises: Promise<string>[] = []
  for (let idx = 0; idx < diffFiles.length; idx++) {
    const file = diffFiles[idx]
    const diff = await $`git -C ${directory} diff ${file}`.text()
    console.log(`Summarizing diff for ${file}...`)
    summaryPromises.push(Model.summarize(diff))
  }

  const summaries = await Promise.all(summaryPromises)
  const combinedSummaries = summaries.join('\n')

  console.log('Generating combined summaries...\n')
  await Model.finalSummarization(combinedSummaries)
}

await main()
  .then(() => {})
  .catch(err => console.error(err))
  .finally(() => {})

export {}
