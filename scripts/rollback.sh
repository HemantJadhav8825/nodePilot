#!/bin/bash
# NodePilot Rollback Script
# Quickly reverts to the previous stable state

set -e
set -o pipefail

echo "----------------------------------------------------"
echo "⏪ NodePilot: Starting Rollback"
echo "----------------------------------------------------"

# 1. Revert Git State
echo "Step 1: Reverting to previous checkout (HEAD@{1})..."
git checkout HEAD@{1}

# 2. Cleanup & Sync
echo "Step 2: Syncing dependencies..."
if [ -d "api" ]; then
  cd api && npm install --production && cd ..
fi

# 3. Process Recovery
echo "Step 3: Hard restarting PM2 processes..."
pm2 restart ecosystem.config.js

echo "----------------------------------------------------"
echo "✅ NodePilot: Rollback Complete"
echo "----------------------------------------------------"
