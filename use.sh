#!/bin/bash

check_git() {
  if ! command -v git &> /dev/null; then
    echo "Error: git is not installed or not in PATH"
    exit 1
  fi
}

main() {
  check_git

  if git config --global --get alias.gen-commit > /dev/null; then
    echo "gen-commit alias already exists"
    exit 0
  fi

  SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
  npm install
  git config --global alias.gen-commit "!${SCRIPT_DIR}/run.sh"
  echo "Successfully added 'gen-commit' as a Git alias"
}

main "$@"