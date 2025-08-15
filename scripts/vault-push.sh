#!/bin/bash
export VAULT_ADDR=https://secrets.scottylabs.org

usage() {
  echo
  echo -e "\tUsage: $0"
  echo -e "\tPushes all secrets from .env in the current directory to ScottyLabs/cmueats in Vault."
  echo -e "\tOptions:"
  echo -e "\t\t-h, --help    Show this help message and exit\n"
}

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case "$1" in
  -h | --help)
    usage
    exit 0
    ;;
  *)
    echo "Error: This script does not accept arguments." >&2
    usage
    exit 1
    ;;
  esac
  shift
done

# Push all secrets from .env to ScottyLabs/cmueats in Vault
cat .env | xargs -r vault