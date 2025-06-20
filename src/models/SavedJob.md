# SavedJob Model

This model stores jobs that users have saved or are tracking during their job search process.

## Schema Definition

```typescript
export interface ISavedJob extends Document {
	userId: string; // Reference to the User who saved this job
	jobId: string; // Reference to the Job that was saved
	companyId: mongoose.Schema.Types.ObjectId; // Reference to the Company offering the job
	status: string; // Current application status
	notes?: string; // Optional field for user notes
	createdAt: Date;
	updatedAt: Date;
}

const SavedJobSchema = new Schema<ISavedJob>(
	{
		userId: {
			type: String,
			required: true,
			index: true,
		},
		jobId: {
			type: String,
			required: true,
		},
		companyId: {
			type: Schema.Types.ObjectId,
			ref: 'Company',
			required: true,
		},
		status: {
			type: String,
			default: 'saved',
			required: true,
		},
		notes: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
);
```

## Indexes

The schema includes a compound index to ensure a user can only save a specific job once:

```typescript
SavedJobSchema.index({userId: 1, jobId: 1}, {unique: true});
```

## Usage

This model is used to:

1. Track jobs that users are interested in
2. Allow users to make notes on specific jobs
3. Track the status of job applications
4. Associate jobs with companies for reference

## Important Properties

- `userId`: The ID of the user who saved this job
- `jobId`: The ID of the job that was saved
- `companyId`: Reference to the Company model (for associating jobs with companies)
- `status`: The current status of the saved job (e.g., 'saved', 'applied', 'interviewed', etc.)
- `notes`: Optional notes that the user can add about the job

## Related Services

See `SavedJobService` for business logic related to this model.
