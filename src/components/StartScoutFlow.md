# Start Scout Flow

This document describes the job search flow initiated by the "Start New Scout" button in the dashboard.

## Flow Description

1. The user clicks the "Start New Scout" button in the dashboard.
2. The `StartScoutButton` component displays a modal that allows users to select from available tracked companies.
   - Companies are considered available if they haven't been scraped within the configured interval (defined in `appConfig`).
3. Upon selection and confirmation, a `SearchModal` opens.
4. The `SearchModal`:
   - Shows a confirmation screen with all the parameters for the search
   - When the user confirms, it sends the payload to the `/api/jobs` API route
   - The payload includes:
     - The user's credentials
     - Selected company IDs
     - The user's CV URL
     - Candidate information for job matching
5. The API route processes each company:
   - Retrieves company details
   - Calls the job matching orchestrator to find suitable jobs
   - Saves matched jobs to the database
6. Once complete, the `SearchModal` reports the results to the dashboard
7. The dashboard:
   - Refreshes the job list to include newly found jobs
   - Shows a notification about the search results

## Component Responsibilities

### StartScoutButton.tsx

- Displays the "Start New Scout" button
- Shows a company selection modal with tracked companies
- Filters out companies that have been recently scraped
- Passes selected company IDs to the parent component

### SearchModal.tsx

- Displays the search parameters for confirmation
- Initiates the job search request to the API
- Shows loading state during the search
- Handles success/error states
- Notifies the parent component when search is complete

### Dashboard (page.tsx)

- Holds the search state and request body
- Shows notifications about search results
- Refreshes job list when new jobs are found

### API Route (api/jobs/route.ts)

- Receives the search request
- Validates the request parameters
- Processes each company to find matching jobs
- Adds matching jobs to the database
- Returns summary of results

## API Contract

### POST /api/jobs

#### Request Body

```typescript
{
  credentials: {
    gmail: string;
  };
  companyIds: string[];
  cvUrl: string;
  candidateInfo: Record<string, any>;
}
```

#### Response

```typescript
{
	results: Array<{
		company: string;
		processed: boolean;
		error?: string;
		results: Array<any>; // Matching jobs
	}>;
}
```

## User Experience

When the user clicks "Start New Scout" in the dashboard:

1. A modal appears showing companies available for scouting
2. User selects companies and clicks "Start Scouting"
3. A confirmation dialog shows the search parameters
4. User confirms and the search begins
5. After completion, a notification appears showing success/failure and number of jobs found
6. The job list refreshes to include any new jobs found
7. New jobs are shown in the job list and Kanban view (if enabled)
