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

  const diff = await $`git -C ${directory} diff`.text()
  await Model.invoke(diff, useAnthropic)
}

await main()
  .then(() => {})
  .catch(err => console.error(err))
  .finally(() => {})

export {}
