#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROVIDER="ollama"

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

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --provider=*)
        PROVIDER="${1#*=}"
        shift
        ;;
      *)
      # Unknown option - J
      shift
      ;;
    esac
  done
}

main() {
  check_node
  check_bun
  check_package_json
  check_node_modules

  original_pwd=$PWD
  parse_args "$@"

  if [ "$PROVIDER" == "ollama" ]; then
   check_ollama
  fi

  cd "$SCRIPT_DIR"
  npm start --silent -- --pwd "$original_pwd" --provider "$PROVIDER"
}

main "$@"