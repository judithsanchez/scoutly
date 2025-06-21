# Scheduler Service Documentation

## Overview

The scheduler service (`scheduler.ts`) is responsible for automatically determining which companies need to be scraped based on user preferences and company rank cooldowns. It runs periodically and adds jobs to the JobQueue for processing by the worker.

## Architecture

- **Model**: Uses UserCompanyPreference to determine which companies users are tracking
- **Priority System**: Uses company rank to determine scrape frequency
- **Queue Management**: Adds jobs to JobQueue with PENDING status
- **Logging**: Uses database-backed Logger for persistent monitoring

## Cooldown Logic

The scheduler uses a rank-based cooldown system:

| Rank Range | Frequency    | Cooldown Hours |
| ---------- | ------------ | -------------- |
| ≥ 95       | Twice daily  | 12 hours       |
| ≥ 85       | Daily        | 24 hours       |
| ≥ 70       | Every 2 days | 48 hours       |
| ≥ 50       | Weekly       | 7 \* 24 hours  |
| < 50       | Bi-weekly    | 14 \* 24 hours |

## Key Functions

### `getCooldownInHours(rank: number): number`

Calculates the cooldown period based on company rank.

### `queueDueJobs(): Promise<void>`

Main scheduler function that:

1. Fetches all users from the database
2. Gets their company preferences (isTracking: true)
3. Checks if companies are due for scraping based on cooldown
4. Queues jobs if no pending/processing job exists for the company
5. Logs all activities to the database

## Usage

### Programmatic

```typescript
import {queueDueJobs} from '@/scripts/scheduler';

await queueDueJobs();
```

### Command Line

```bash
npx tsx src/scripts/scheduler.ts
```

### Docker

```bash
docker-compose exec app npx tsx src/scripts/scheduler.ts
```

## Test Coverage

Comprehensive test suite in `__tests__/scheduler.test.ts` covers:

- High-rank company cooldown logic
- Low-rank company cooldown logic
- Duplicate job prevention
- Multi-user/multi-company scenarios
- Edge cases and error handling

## Monitoring

- Uses Logger('Scheduler') for database-backed logging
- Logs include company details, user info, and timing information
- Call `await logger.saveBufferedLogs()` to persist logs

## Implementation Status

✅ **COMPLETE** - Fully implemented and tested

- All tests passing
- Follows TDD approach
- Uses pipeline architecture exclusively
- Database-backed logging implemented
- Ready for production deployment

## Dependencies

- `@/models/User` - User model
- `@/models/Company` - Company model
- `@/models/UserCompanyPreference` - User-company relationship model
- `@/models/JobQueue` - Job queue model
- `@/utils/logger` - Database-backed logging
- `@/middleware/database` - Database connection

## Notes

- Designed to run as a cron job or scheduled task
- Safe to run multiple times - prevents duplicate job creation
- Uses populated queries for efficient data fetching
- Graceful error handling with comprehensive logging
