#!/usr/bin/env bash

# Create the log directory in tmp
mkdir -p /tmp/scoutly-logs

echo "Creating log directory in /tmp/scoutly-logs"

# Update logger in all script files
for file in /home/judithsanchez/dev/scoutly/src/scripts/*.ts; do
    echo "Updating logger in $file..."
    npx tsx /home/judithsanchez/dev/scoutly/src/utils/logger-updater.ts "$file"
done

echo "All scripts updated to use EnhancedLogger"
