#!/usr/bin/env bash
# Pull the latest code, rebuild, and restart. Run on the droplet as the lyntrix user:
#   cd ~/lyntrixtec && ./deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
npm ci
npm run build
sudo systemctl restart lyntrix
echo "Deployed $(git rev-parse --short HEAD)"
