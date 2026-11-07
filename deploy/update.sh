#!/usr/bin/env bash
# Pull the latest code, rebuild and restart. Run on the droplet as root:
#   bash /home/lyntrix/lyntrixtec/deploy/update.sh
# Set BRANCH=... to deploy another branch (default: main).
set -euo pipefail
exec bash "$(dirname "$0")/install.sh"
