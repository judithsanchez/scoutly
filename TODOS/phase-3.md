Phase 3: Docker & Cron Integration
Goal: To configure the Docker environment to automatically run the scheduler and worker scripts as background services, alongside the main Next.js application.

Step 3.1: Update the Dockerfile
Purpose: We need to add the cron daemon to our app container's operating system and copy our new configuration files into it.

Action: Modify your root Dockerfile.

# Your existing Dockerfile content...

# (e.g., FROM node:18-alpine, WORKDIR /app, COPY package\*.json ./, etc.)

# Add these lines after your package installation steps (e.g., after npm install)

# ----------------------------------------------------------------------

# Install cron and other necessary utilities

# Using debian-based image as an example. If using Alpine, use 'apk add --no-cache cron'

RUN apt-get update && apt-get install -y cron

# Copy the crontab file we will create into the cron directory

COPY crontab /etc/cron.d/scoutly-cron

# Give the crontab file the correct permissions

RUN chmod 0644 /etc/cron.d/scoutly-cron

# Copy our new entrypoint script

COPY entrypoint.sh /app/entrypoint.sh

# Make the entrypoint script executable

RUN chmod +x /app/entrypoint.sh

# ----------------------------------------------------------------------

# Your existing CMD or EXPOSE lines...

# Set the entrypoint for the container

ENTRYPOINT ["/app/entrypoint.sh"]

Step 3.2: Define the Cron Job (crontab)
Purpose: This file tells the cron daemon what script to run and how often to run it.

Action: In the root directory of your project, create a new file named crontab (with no file extension).

Contents:

# This is the crontab file for Scoutly background jobs.

#

# Schedule: Run the scheduler script at the start of every hour.

# Command: Use tsx to execute the TypeScript scheduler script.

# Logging: Redirect all output (both stdout and stderr) to the cron log file for debugging.

#

0 \* \* \* \* root tsx /app/src/scripts/scheduler.ts >> /var/log/cron.log 2>&1

# An empty line is required at the end of the file for cron to work correctly.

Explanation:

0 \* \* \* \*: This is the schedule. It means "at minute 0 of every hour of every day".

root: The user to run the command as.

tsx /app/src/scripts/scheduler.ts: The command to execute. It runs our scheduler script.

> > /var/log/cron.log 2>&1: This is crucial for visibility. It appends all output and errors from the script to a log file inside the container.

Step 3.3: Create the Container Entrypoint Script
Purpose: A Docker container can only have one main command (CMD or ENTRYPOINT). To run our Next.js app, the worker.ts script, and the cron service, we need an entrypoint script to launch and manage all of them.

Action: In the root directory of your project, create a new file named entrypoint.sh.

Contents:

#!/bin/sh

# This script is the entrypoint for the Docker container.

# It starts all necessary background services and then the main application.

echo "Starting Scoutly services..."

# 1. Start the cron daemon in the background

echo "Starting cron service..."
cron

# 2. Start the queue worker in the background

echo "Starting queue worker..."
tsx /app/src/scripts/worker.ts &

# 3. Start the main Next.js application in the foreground

echo "Starting Next.js application..."
npm run dev

Step 3.4: Update docker-compose.yml
Purpose: The final step is to tell Docker Compose to use our new entrypoint.sh script instead of its default command.

Action: Modify your docker-compose.yml file.

# docker-compose.yml

services:
mongodb: # ... (no changes here)
app:
build: .
ports: - '3000:3000'
volumes: - .:/app - /app/node_modules
environment: # ... (your existing environment variables)
depends_on:
mongodb:
condition: service_healthy # REMOVE the existing "command" line if you have one, # because the ENTRYPOINT in the Dockerfile now handles this. # The healthcheck can remain as is.
healthcheck:
test: wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
interval: 10s
timeout: 5s
retries: 5
start_period: 15s
shm_size: 2gb

Final Check
After making these changes, you will need to rebuild and restart your container for them to take effect:

Stop: docker-compose down

Rebuild: docker-compose build

Start: docker-compose up -d

Once started, you can use the monitoring commands from Step 2.3 to see your new automated system in action!
