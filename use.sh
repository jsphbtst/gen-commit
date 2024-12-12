#!/bin/bash

check_git() {
  if ! command -v git &> /dev/null; then
    echo "Error: git is not installed or not in PATH"
    exit 1
  fi
}

check_node() {
  if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install it first."
    exit 1
  fi
}

check_bun() {
  if ! command -v bun &> /dev/null; then
    echo "Bun is not installed. Please install it first."
    exit 1
  fi
}

main() {
  check_git
  check_node
  check_bun

  if git config --global --get alias.gen-commit > /dev/null; then
    echo "gen-commit alias already exists"
    exit 0
  fi

  SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
  bun install
  git config --global alias.gen-commit "!${SCRIPT_DIR}/run.sh"
  echo "Successfully added 'gen-commit' as a Git alias"
}

main "$@"