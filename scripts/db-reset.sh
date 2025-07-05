#!/bin/bash

# Database Reset Script for Scoutly
# This script helps reset the MongoDB database when authentication changes are made

echo "🗄️  Resetting Scoutly Database..."

# Stop containers
echo "📦 Stopping containers..."
docker compose down

# Remove the MongoDB volume to start fresh with new authentication
echo "🧹 Removing existing database volume..."
docker volume rm scoutly_mongodb_data 2>/dev/null || echo "Volume not found (this is fine for fresh setup)"

# Rebuild and start containers
echo "🔨 Building and starting containers with authentication..."
docker compose build --no-cache app
docker compose up -d

# Wait for database to be ready
echo "⏱️  Waiting for database to initialize..."
sleep 10

# Check if containers are running
echo "🔍 Checking container status..."
docker compose ps

echo "✅ Database reset complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run seed script: docker compose exec app npx tsx src/scripts/seedCompanies.ts"
echo "2. Check logs: docker compose logs -f app"
echo "3. View database: Access via external connection with credentials from .env"
