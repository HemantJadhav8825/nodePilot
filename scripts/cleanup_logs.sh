#!/bin/bash
# NodePilot Log Cleanup Script
# Removes job logs older than 7 days to save space on VPS

LOG_DIR="$(dirname "$0")/../server/logs"

echo "🧹 NodePilot: Cleaning up logs older than 7 days in $LOG_DIR..."

if [ -d "$LOG_DIR" ]; then
    find "$LOG_DIR" -name "*.log" -type f -mtime +7 -delete
    echo "✅ Cleanup complete."
else
    echo "⚠️ Log directory not found. Skipping."
fi
