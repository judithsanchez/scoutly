#!/bin/bash

# Quick Reset Script for Manual Testing - Docker Version
# This script runs the reset command inside the Docker container where
# the environment variables and database connection are properly configured.

echo "🚀 Running reset script inside Docker container..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not available. Please make sure Docker is installed and running."
    exit 1
fi

# Run the reset script inside the app container
docker-compose exec app npm run reset-for-testing

echo "✅ Reset completed!"
