# Background Jobs System Usage Guide

This guide explains how to use the background job system for company scraping, which supports both intermittent (laptop/desktop) use and continuous operation (Raspberry Pi).

## System Components

1. **User Company Preferences**: Tracks which companies users want to monitor and their priority (rank 1-100)
2. **Job Queue**: Manages pending, processing, and completed scraping jobs
3. **Scheduling Logic**: Dynamically schedules scraping based on company rank:
   - Ranks 81-100: Daily scraping (highest priority)
   - Ranks 61-80: Every 2 days
   - Ranks 31-60: Every 3 days
   - Ranks 11-30: Every 4 days
   - Ranks 1-10: Every 5 days (lowest priority)

## Environment Configuration

### Required Environment Variables

The background jobs system requires these environment variables:

- `GEMINI_API_KEY`: Google's Gemini AI API key for job analysis (must be set in .env file)
- `MONGODB_URI`: MongoDB connection string

### Docker Configuration

Environment variables are passed through from your host machine via `docker-compose.yml`:

```yaml
environment:
  - GEMINI_API_KEY=${GEMINI_API_KEY}
  - MONGODB_URI=mongodb://mongodb:27017/scoutly
```

### When to Rebuild Docker

You need to rebuild the Docker container in these cases:

1. When changing environment variables in the Docker Compose file
2. When adding new dependencies to `package.json`

**Environment variables passed through like `GEMINI_API_KEY` only require a restart, not a rebuild.**

## Available Scripts

### Setup Scripts

- `npm run db:seed-preferences`: Seeds realistic user company preferences for testing
- `npm run jobs:status`: Displays comprehensive system status and statistics

### Job Management Scripts

- `npm run jobs:direct-enqueue`: Scans for companies due for scraping and adds them to the queue (recommended)
- `npm run jobs:enqueue`: Alternative enqueuing script (currently has Logger dependency issues)
- `npm run jobs:process`: Processes jobs from the queue with parallel execution

## Docker Variants

All scripts are also available with Docker prefixes for container execution:

- `npm run docker:seed-preferences`
- `npm run docker:jobs-status`
- `npm run docker:jobs-direct-enqueue`
- `npm run docker:jobs-process`

## Usage Modes

### Development Mode (Laptop/Desktop)

For systems that aren't always on, use anacron-style scheduling:

1. **Initial Setup**:

   ```bash
   # Seed test preferences (if needed)
   npm run docker:seed-preferences
   ```

2. **Daily Operation**:

   ```bash
   # Check status first
   npm run docker:jobs-status

   # Enqueue jobs due for scraping
   npm run docker:jobs-direct-enqueue

   # Process jobs (runs until completed or timeout)
   npm run docker:jobs-process

   # Check final status
   npm run docker:jobs-status
   ```

3. **Add to Startup/Login**:
   - Add these scripts to system startup or user login scripts
   - This ensures jobs run when system is available

### Production Mode (Raspberry Pi 5)

For continuous operation systems:

1. **Initial Setup**:

   ```bash
   # Set up data first
   npm run docker:seed-preferences
   ```

2. **Scheduled Operation (cron)**:

   ```
   # Enqueue jobs every 1 hour
   0 */1 * * * cd /path/to/app && npm run jobs:direct-enqueue >> /path/to/logs/enqueue.log 2>&1

   # Keep processor running continuously (restarts if it exits)
   @reboot cd /path/to/app && npm run jobs:process >> /path/to/logs/process.log 2>&1

   # Generate status report daily
   0 8 * * * cd /path/to/app && npm run jobs:status >> /path/to/logs/status.log 2>&1
   ```

## Monitoring

Check system status at any time:

```bash
# Get comprehensive status report
npm run docker:jobs-status

# Quick queue check
docker compose exec mongodb mongosh --quiet --eval "db.jobqueues.countDocuments({status: 'pending'})" scoutly

# Check saved jobs count for a specific user
docker compose exec mongodb mongosh --quiet --eval "db = db.getSiblingDB('scoutly'); const user = db.users.findOne({email: 'judithv.sanchezc@gmail.com'}); if (user) { console.log('Saved Jobs Count:', db.savedjobs.find({user: user._id}).count()); }"
```

## Enhanced Debugging

A new debugging tool is available to help diagnose and fix issues with the background jobs system:

```bash
# Run the background jobs debugger
npx tsx src/utils/backgroundJobsDebugger.ts

# Run with pipeline testing (will process a real job)
npx tsx src/utils/backgroundJobsDebugger.ts --test-pipeline

# In Docker
docker compose exec app npx tsx src/utils/backgroundJobsDebugger.ts
```

### Enhanced Logging

Rich logging is now available in these locations:

- In Docker: `/tmp/scoutly-logs/`
- Default log files:
  - `queue-processor.log`: Main processor logs
  - `job-matching-orchestrator.log`: Orchestrator logs
  - `job-results-storage.log`: Job storage logs
  - `jobs-debugger.log`: Debugger logs

```bash
# View processor logs
docker compose exec app cat /tmp/scoutly-logs/queue-processor.log

# Tail logs in real-time
docker compose exec app tail -f /tmp/scoutly-logs/queue-processor.log
```

### Reset Stuck Jobs

If jobs get stuck in "processing" status:

```bash
# Run the debugger to automatically reset stuck jobs
docker compose exec app npx tsx src/utils/backgroundJobsDebugger.ts
```

## Performance Notes

- Designed for Raspberry Pi 5 (8GB RAM)
- Limits concurrent processing to 5 companies
- Uses intelligent job prioritization based on company rank and time since last scrape
- Includes anti-bot protections and exponential backoff for problematic sites

## Next Steps for Optimization

- Add priority-based processing for high-rank companies
- Implement more sophisticated web scraping retry logic
- Develop UI for managing company preferences and monitoring status
- Add email/push notifications for important status updates
