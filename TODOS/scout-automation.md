Scoutly Automation: Implementation Plan
This document outlines the phased approach to building a robust, automated, and polite scraping system for Scoutly. Each phase consists of self-contained steps that build upon the last.

Phase 1: Foundational Improvements
This phase focuses on strengthening the existing codebase to ensure it's ready for automation.

Step 0: Create JobQueue Model

Goal: Create the missing JobQueue model required for the automation engine.

Why: The automation scripts in Phase 2 need a job queue system to manage background tasks, but this model doesn't currently exist.

Step 1.1: Consolidate User-Company Relationship

Goal: Fully migrate from the trackedCompanies array in the User model to the dedicated UserCompanyPreference model.

Why: This creates a single, scalable source of truth for user preferences. The user-centric scheduling logic in Phase 2 will rely entirely on this model.

Step 1.2: Implement Live Rate-Limit Enforcement

Goal: Enhance the pipeline architecture to track and respect API rate limits during a scraping session.

Why: This prevents your system from being blocked by the AI provider for sending too many requests or tokens in a short period. It's crucial for politeness and reliability.

Phase 2: Building the Automation Engine
This phase involves creating the core scripts that will power the scheduled tasks.

Step 2.1: Create the "Scheduler" Script

Goal: Develop a script (src/scripts/scheduler.ts) that populates a job queue based on individual user preferences.

Logic (User-Centric):

Fetch all users from the database.

For each user, fetch their list of tracked companies from UserCompanyPreference.

For each tracked company, compare its global lastSuccessfulScrape date against the user-specific rank.

Use a set of rules to determine if a scrape is due based on the rank (see below).

If a scrape is due, check if a PENDING or PROCESSING job for that company already exists in the JobQueue.

If no active job exists, add a new one to the queue with a PENDING status.

Ranking Rules (Scraping Frequency):

Rank 95-100: Scrape if older than 12 hours (Twice a day).

Rank 85-94: Scrape if older than 24 hours (Once a day).

Rank 70-84: Scrape if older than 2 days.

Rank 50-69: Scrape if older than 7 days (Once per week).

Rank < 50: Scrape if older than 14 days (Once every two weeks).

Step 2.2: Create the "Queue Worker" Script

Goal: Develop a script (src/scripts/worker.ts) that processes the jobs created by the scheduler.

Logic:

This script will run continuously as a background process.

It will poll the JobQueue collection for jobs with a pending status.

When a job is found, it updates its status to processing.

It then calls the pipeline-based job matching system to perform the actual scrape and analysis.

Upon completion, it updates the job status to completed or failed.

Phase 3: Docker & Cron Integration
This phase integrates the automation engine into your Docker environment so it runs automatically.

Step 3.1: Configure the Docker Environment

Goal: Update the Dockerfile to install cron and set up the necessary file permissions.

Step 3.2: Define the Cron Job

Goal: Create a crontab file that defines the schedule for the "Scheduler" script (from Step 2.1).

Example: Run the scheduler script once every hour.

Step 3.3: Orchestrate Container Startup

Goal: Create an entrypoint.sh script to manage the container's processes.

Logic: This script will start three services: the cron daemon, the "Queue Worker" script (from Step 2.2), and the main Next.js application.

Step 3.4: Update Docker Compose

Goal: Modify the docker-compose.yml file to use the new entrypoint.sh script, bringing the entire automated system to life.
