# Saved Job Service

This service manages saved jobs for users, allowing them to save, unsave, and update the status of jobs they're interested in.

## Methods

### getSavedJobsByUserId

```typescript
static async getSavedJobsByUserId(userId: string)
```

Gets all saved jobs for a user.

**Parameters**:

- `userId`: The ID of the user

**Returns**: Array of saved jobs with populated company data

**Example**:

```typescript
const savedJobs = await SavedJobService.getSavedJobsByUserId('user123');
```

### saveJob

```typescript
static async saveJob(userId: string, jobId: string, companyId: string)
```

Saves a job for a user.

**Parameters**:

- `userId`: The ID of the user
- `jobId`: The ID of the job to save
- `companyId`: The ID of the company offering the job

**Returns**: The saved job document

**Example**:

```typescript
const savedJob = await SavedJobService.saveJob(
	'user123',
	'job456',
	'company789',
);
```

### unsaveJob

```typescript
static async unsaveJob(userId: string, jobId: string)
```

Unsaves (removes) a job for a user.

**Parameters**:

- `userId`: The ID of the user
- `jobId`: The ID of the job to unsave

**Returns**: An object with a success boolean

**Example**:

```typescript
const result = await SavedJobService.unsaveJob('user123', 'job456');
if (result.success) {
	console.log('Job unsaved successfully');
}
```

### updateJobStatus

```typescript
static async updateJobStatus(userId: string, jobId: string, status: string)
```

Updates the status of a saved job.

**Parameters**:

- `userId`: The ID of the user
- `jobId`: The ID of the job to update
- `status`: The new status (e.g., 'applied', 'interviewed', etc.)

**Returns**: The updated saved job document

**Example**:

```typescript
const updatedJob = await SavedJobService.updateJobStatus(
	'user123',
	'job456',
	'applied',
);
```

## Error Handling

All methods include robust error handling. While most errors are propagated to the caller, the `getSavedJobsByUserId` method returns an empty array instead of throwing an error when no saved jobs are found, to handle new users gracefully.

## Related Models

- SavedJob: The model this service manages
- Company: Referenced by saved jobs via companyId
