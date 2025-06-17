# useCompanies Hook

This hook manages company data and tracked companies for a user.

## Usage

```tsx
const {
	companies, // Array of all companies (ICompany[])
	trackedCompanies, // Array of tracked companies ({companyID: string, ranking: number}[])
	isLoading, // Boolean indicating if companies or tracked companies are loading
	isError, // Boolean indicating if there was an error fetching data
	error, // Error object if there was an error
	isRefetching, // Boolean indicating if data is being refetched
	refetch, // Function to refetch both companies and tracked companies
	trackCompany, // Function to track a company (companyId: string, ranking?: number) => void
	untrackCompany, // Function to untrack a company (companyId: string) => void
	updateRanking, // Function to update company ranking (companyId: string, ranking: number) => void
	createCompany, // Function to create a new company (companyData: CreateCompanyInput) => Promise<any>
	isCreatingCompany, // Boolean indicating if a company is being created
} = useCompanies();
```

## Implementation Note

The hook integrates both `companies` and `trackedCompanies` data in a single hook to simplify state management. If you need to determine if a company is tracked, you can use the `trackedCompanies` array to check.

## Example: Filtering Available Companies for Scouting

```tsx
const {companies, trackedCompanies, isLoading} = useCompanies();

// Calculate companies available for scouting (not recently scraped)
const availableCompanies = React.useMemo(() => {
	if (
		!companies ||
		!trackedCompanies ||
		!companies.length ||
		!trackedCompanies.length
	)
		return [];

	// Get current timestamp
	const now = new Date();

	// Filter companies that are tracked and not recently scraped
	return companies.filter(company => {
		// Find if the company is tracked
		const trackedCompany = trackedCompanies.find(
			tc => tc.companyID === company.companyID,
		);

		// If not tracked, it's not available for scouting
		if (!trackedCompany) return false;

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
}, [companies, trackedCompanies]);
```

## API Endpoints Used

- GET `/api/companies` - Fetch all companies
- GET `/api/users/tracked-companies` - Fetch tracked companies for the current user
- POST `/api/users/tracked-companies` - Track a new company
- DELETE `/api/users/tracked-companies/:companyId` - Untrack a company
- PUT `/api/users/tracked-companies/:companyId` - Update company ranking
- POST `/api/companies/create` - Create a new company
