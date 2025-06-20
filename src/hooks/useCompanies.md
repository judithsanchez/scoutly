# useCompanies Hook

This hook manages company data and tracked companies for a user.

## Data Models

### TrackedCompany

Represents a company with the user's tracking preferences:

```typescript
interface TrackedCompany {
	_id: string;
	companyID: string;
	company: string;
	careers_url: string;
	logo_url?: string;
	userPreference: {
		rank: number;
		isTracking: boolean;
		frequency: string;
		lastUpdated: Date;
	};
}
```

**Important**: This interface only includes companies the user has explicitly chosen to track. New users will have an empty `trackedCompanies` array.

## Usage

```tsx
const {
	companies, // Array of all companies (ICompany[])
	trackedCompanies, // Array of tracked companies with user preferences
	isLoading, // Boolean indicating if companies or tracked companies are loading
	isError, // Boolean indicating if there was an error fetching data
	error, // Error object if there was an error
	isRefetching, // Boolean indicating if data is being refetched
	refetch, // Function to refetch both companies and tracked companies
	trackCompany, // Function to track a company (companyId: string, rank?: number) => void
	untrackCompany, // Function to untrack a company (companyId: string) => void
	updateRanking, // Function to update company rank (companyId: string, rank: number) => void
	createCompany, // Function to create a new company (companyData: CreateCompanyInput) => Promise<any>
	isCreatingCompany, // Boolean indicating if a company is being created
} = useCompanies();
```

## Implementation Note

The hook integrates both `companies` and `trackedCompanies` data in a single hook to simplify state management. The `trackedCompanies` array now contains both company data and user preference data nested in a `userPreference` property.

## Example: Filtering Available Companies for Scouting

```tsx
const {companies, trackedCompanies, isLoading} = useCompanies();

// Calculate companies available for scouting (not recently scraped)
const availableCompanies = React.useMemo(() => {
	if (!trackedCompanies || !trackedCompanies.length) return [];

	// Get current timestamp
	const now = new Date();

	// Filter companies that are tracked and not recently scraped
	return trackedCompanies.filter(company => {
		// If not tracking, it's not available for scouting
		if (!company.userPreference?.isTracking) return false;

		// If no scrape history, it's available
		if (!company.lastSuccessfulScrape) return true;

		// Check if the company was scraped recently
		const scrapeDate = new Date(company.lastSuccessfulScrape);
		const daysSinceScrape = Math.floor(
			(now.getTime() - scrapeDate.getTime()) / (1000 * 60 * 60 * 24),
		);

		// If it was scraped more than the interval days ago, it's available
		return daysSinceScrape >= config.app.companyScrapeIntervalDays;
	});
}, [trackedCompanies]);
```

## API Endpoints Used

- GET `/api/companies` - Fetch all companies
- GET `/api/user-company-preferences` - Fetch tracked companies for the current user
- POST `/api/user-company-preferences` - Track a new company
- DELETE `/api/user-company-preferences/:companyId` - Untrack a company
- PUT `/api/user-company-preferences/:companyId` - Update company rank
- POST `/api/companies/create` - Create a new company
