# Worker Service Documentation

## Overview

The worker service (`worker.ts`) is a long-running background process that continuously polls the JobQueue for PENDING jobs and executes them using the job matching pipeline. It processes one job at a time and updates job status accordingly.

## Architecture

- **Polling Model**: Continuously polls JobQueue for PENDING jobs
- **Pipeline Integration**: Uses the job matching pipeline exclusively
- **Job Management**: Updates job status (PENDING → PROCESSING → COMPLETED/FAILED)
- **Error Handling**: Graceful error handling with detailed logging
- **User Context**: Currently uses hardcoded user (judithv.sanchezc@gmail.com)

## Key Functions

### `processJob(job: any, logger: Logger): Promise<void>`

Processes a single job by:

1. Finding the company by ID
2. Finding the user (currently hardcoded)
3. Executing the job matching pipeline
4. Updating company's lastSuccessfulScrape timestamp
5. Logging all activities

### `startWorker(): Promise<void>`

Main worker loop that:

1. Connects to database
2. Polls for PENDING jobs (oldest first)
3. Updates job status to PROCESSING
4. Processes the job
5. Updates job status to COMPLETED or FAILED
6. Repeats with 5-second delay when no jobs available

## Job Processing Flow

```
1. Find PENDING job (atomic update to PROCESSING)
2. Fetch company and user data
3. Execute pipeline: executeJobMatchingPipeline()
4. Update company.lastSuccessfulScrape
5. Set job status to COMPLETED
6. Save comprehensive logs
```

## Error Handling

- Company/User not found: Throws descriptive error
- Pipeline execution failure: Catches and logs error, marks job as FAILED
- Database errors: Logged and job marked as FAILED
- All errors include job context and detailed logging

## Usage

### Command Line

```bash
npx tsx src/scripts/worker.ts
```

### Docker (Background Service)

```bash
docker-compose up -d app
# Worker starts automatically as part of the application
```

### Programmatic (Testing)

```typescript
import {processJob} from '@/scripts/worker';
import {Logger} from '@/utils/logger';

const logger = new Logger('TestWorker');
await processJob(jobObject, logger);
```

## Test Coverage

Comprehensive test suite in `__tests__/worker.test.ts` covers:

- Job status transitions (PENDING → PROCESSING)
- Pipeline execution with correct parameters
- Company lastSuccessfulScrape updates
- Error handling for missing data
- Pipeline execution errors
- Job completion and failure scenarios

## Monitoring

- Uses per-job Logger instance: `Logger(\`Worker-Job-\${job.\_id}\`)`
- Logs include job ID, company details, and execution results
- Database-backed logging for persistent monitoring
- Call `await logger.saveBufferedLogs()` after each job

## Current Limitations

- **Hardcoded User**: Currently uses 'judithv.sanchezc@gmail.com'
- **Single Worker**: Processes one job at a time
- **No Retry Logic**: Failed jobs are not automatically retried

## Future Enhancements

- [ ] Support multiple users per job
- [ ] Implement job retry logic with exponential backoff
- [ ] Add worker health checks and heartbeat monitoring
- [ ] Support multiple concurrent workers
- [ ] Add job priority system

## Implementation Status

✅ **COMPLETE** - Fully implemented and tested

- All tests passing
- Uses pipeline architecture exclusively
- Comprehensive error handling
- Database-backed logging
- Ready for production deployment

## Dependencies

- `@/models/Company` - Company model
- `@/models/User` - User model
- `@/models/JobQueue` - Job queue model
- `@/services/pipeline/JobMatchingPipelineConfig` - Pipeline execution
- `@/utils/logger` - Database-backed logging
- `@/middleware/database` - Database connection

## Configuration

Environment variables:

- Database connection settings (MongoDB)
- Gemini API key (for pipeline execution)
- Pipeline-specific configuration

## Notes

- Designed to run as a daemon/background service
- Safe to restart - will resume processing queued jobs
- Uses atomic operations to prevent job conflicts
- Graceful shutdown handling (process termination)
- Compatible with Docker containerization
