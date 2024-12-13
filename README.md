# gen-commit alias

This repo creates a custom git alias that integrates from select LLM providers to generate commit messages given a diff. Lazy man's commit message generator, if you will.

## System Requirements

- Git (duh)
- Node.js v20+ (alongside npm)
- Bun v1.1.9+
- Ollama

## Usage

Run `./use.sh` to both add `gen-commit` to your gitconfig and to install the necessary Node dependencies.

In any folder that's part of a Git repository, just run `git gen-commit` and the LLM will analyze the diff and generate a commit message for you.

If you'd like to specify a specific LLM provider, we currently have three supported:

- ollama
- xai
- anthropic
- openai

Your command would then look something like this: `git gen-commit --provider=xai`. Not providing the `provider` arg defaults to your local running Ollama instance: `git gen-commit`.

## TODOs:

- [x] Chunk processing of bigger diffs
- [ ] Manage configs to specify which LLM model to use
- [x] Add more flags for other LLMs (OpenAI, xAI, Gemini, et al.)
