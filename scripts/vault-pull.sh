#!/bin/bash
export VAULT_ADDR=https://secrets.scottylabs.org

usage() {
  echo
  echo -e "\tUsage: $0"
  echo -e "\tPulls all secrets from ScottyLabs/cmueats and writes to .env in the current directory."
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

# Pull all secrets from ScottyLabs/cmueats and write to .env
vault kv get -format=json ScottyLabs/cmueats |
  jq -r '.data.data | to_entries[] | "\(.key)=\"\(.value)\""' > .env
