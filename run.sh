#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

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

check_package_json() {
  if [ ! -f "$SCRIPT_DIR/package.json" ]; then
    echo "package.json not found in project directory."
    exit 1
  fi
}

check_ollama() {
  local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/api/version)
  if [ "$response" != "200" ]; then
    echo "Ollama is not running. Please start Ollama first."
    exit 1
  fi
}

check_node_modules() {
  if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "node_modules not found. Installing dependencies..."
    cd "$SCRIPT_DIR" && npm install
  fi
}

check_use_anthropic() {
  for arg in "$@"; do
    if [ "$arg" = "--use-anthropic" ]; then
      return 0  # true
    fi
  done
  return 1  # false
}

main() {
  check_node
  check_bun
  check_package_json
  check_node_modules

  _USE_ANTHROPIC=false
  check_use_anthropic "$@" && _USE_ANTHROPIC=true

  # Only check ollama if we're not using Anthropic
  $_USE_ANTHROPIC || check_ollama
  original_pwd=$PWD

  cd "$SCRIPT_DIR"
  if $_USE_ANTHROPIC; then
    npm start --silent -- --pwd "$original_pwd" --use-anthropic 1
  else
    npm start --silent -- --pwd "$original_pwd"
  fi
}

main "$@"