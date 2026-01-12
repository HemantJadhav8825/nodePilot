#!/bin/bash
# NodePilot Deployment Script
# Optimized for high-availability on low-resource VPS

set -e # Exit on error
set -u # Error on unset variables
set -o pipefail

echo "----------------------------------------------------"
echo "🚀 NodePilot: Starting Deployment"
echo "----------------------------------------------------"

# 1. Environment Check
if [ -z "$BRANCH" ]; then
  BRANCH="main"
fi

# 2. Update Source
echo "Step 1: Pulling latest changes from $BRANCH..."
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

# 3. Backend Deployment
if [ -d "api" ]; then
  echo "Step 2: Deploying API..."
  cd api
  npm install --production
  cd ..
fi

# 4. Frontend Deployment (Admin)
if [ -d "admin" ]; then
  echo "Step 3: Deploying Admin Panel..."
  cd admin
  npm install
  npm run build
  cd ..
fi

# 5. Production Reload
echo "Step 4: Reloading PM2 processes (Zero-Downtime)..."
pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js

echo "----------------------------------------------------"
echo "✅ NodePilot: Deployment Successful"
echo "----------------------------------------------------"
