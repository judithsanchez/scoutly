# Phase 1, Step 0: Create JobQueue Model

**Goal**: Create the missing JobQueue model that will be used by the automation engine in Phase 2.

**Priority**: This must be completed before Phase 2 can begin.

## Background

The automation engine in Phase 2 requires a JobQueue model to manage background scraping tasks, but this model doesn't currently exist in the codebase. We need to create this model based on the requirements outlined in the automation planning documents.

## Requirements

The JobQueue model should support:

1. **Job Status Tracking**: PENDING, PROCESSING, COMPLETED, FAILED
2. **Company Association**: Link jobs to specific companies
3. **Scheduling Information**: When jobs were created and last attempted
4. **Error Handling**: Store error messages for failed jobs

## Model Specification

```typescript
interface IJobQueue extends Document {
	companyId: mongoose.Schema.Types.ObjectId;
	status: JobStatus;
	createdAt: Date;
	lastAttemptAt?: Date;
	completedAt?: Date;
	errorMessage?: string;
	retryCount: number;
}

enum JobStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
}
```

## Implementation Tasks

1. **Create Model File**: `src/models/JobQueue.ts`
2. **Create Documentation**: `src/models/JobQueue.md`
3. **Export from Index**: Add to `src/models/index.ts` if it exists
4. **Create Basic Tests**: Test model creation and validation

## Success Criteria

- JobQueue model can be imported and used
- Model includes all required fields with proper validation
- Enum for JobStatus is exported and usable
- Documentation explains the model's purpose and usage
- Ready for use in Phase 2 automation scripts
