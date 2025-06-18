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
docker exec scoutly-mongodb-1 mongosh --quiet --eval "db.jobqueues.countDocuments({status: 'pending'})" scoutly
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
