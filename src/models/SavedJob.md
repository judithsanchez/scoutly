# SavedJob Model

This model stores jobs that users have saved or are tracking during their job search process.

**UPDATED (June 2025)**: Significantly enhanced to align with Gemini AI output schema and provide comprehensive job data.

## Schema Definition (Current)

```typescript
export interface ISavedJob extends Document {
	// Core identification
	userId: ObjectId;
	companyId: string;
	jobUrl: string;

	// Job details from AI analysis
	title?: string;
	company?: string;
	location?: string;
	type?: string;
	department?: string;
	experienceLevel?: string;
	postedDate?: string;

	// Compensation and benefits
	salary?: string;
	benefits?: string[];

	// Technical requirements
	technologies?: string[];
	skills?: string[];

	// Logistics and requirements
	visaSponsorship?: boolean;
	languageRequirements?: string[];

	// AI analysis results
	matchScore?: number;
	suitabilityAnalysis?: string;
	keyHighlights?: string[];
	notes?: string;

	// Application tracking
	status:
		| 'interested'
		| 'applied'
		| 'interviewing'
		| 'rejected'
		| 'offer'
		| 'not_interested';

	// Metadata
	createdAt: Date;
	updatedAt: Date;
}
```

## Key Features (Post-Refactor)

### Enhanced Data Capture

- **Comprehensive Job Info**: All relevant job details from AI analysis
- **Technology Tracking**: Explicit fields for required technologies and skills
- **Logistics Information**: Visa sponsorship and language requirements
- **AI Analysis Results**: Match scores and detailed suitability analysis

### Application Status Management

- **Rich Status Options**: From 'interested' to 'offer' with clear workflow
- **Status History**: Tracked through updatedAt timestamps
- **API Integration**: Easy status updates via REST endpoints

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
