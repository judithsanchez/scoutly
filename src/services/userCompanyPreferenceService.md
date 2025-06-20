# User Company Preference Service

## Overview

The UserCompanyPreferenceService manages user-specific company tracking preferences, including rankings and tracking status. This service provides the core functionality for users to customize which companies they want to track and how frequently they should be scraped.

**Important**: Users start with no tracked companies by default. All company tracking is explicit and must be configured through this service.

## Core Features

1. **Company Tracking Management**

   - Add/remove companies from tracking
   - Set custom rankings (1-100)
   - Enable/disable tracking per company

2. **Preference Queries**

   - Get all tracked companies for a user
   - Get all companies with preference status
   - Retrieve tracking statistics

3. **Ranking System**
   - Rank 1-100 (100 = highest priority)
   - Automatic frequency calculation based on rank
   - Real-time frequency descriptions

## Important Behavior

- **User Creation**: New users are created with NO tracked companies. All company tracking is explicit and must be configured through this service.
- **Company ID Flexibility**: All methods accept either MongoDB `_id` or the custom `companyID` field, making the API more flexible for frontend usage.

## API Methods

### setCompanyPreference(userId, companyIdOrObjectId, rank, isTracking)

Creates or updates a company tracking preference.

**Parameters**:

- `userId`: User identifier
- `companyIdOrObjectId`: Company identifier (accepts either MongoDB \_id or companyID field)
- `rank`: Priority rank (1-100, 100 = highest priority)
- `isTracking`: Boolean tracking status (default: true)

**Returns**: Updated UserCompanyPreference document

**Example**:

```typescript
const preference = await UserCompanyPreferenceService.setCompanyPreference(
	'user123',
	'10up', // Can use companyID field
	85, // High priority
	true,
);
```

### getTrackedCompanies(userId)

Retrieves all companies being tracked by a user, enriched with preference data.

**Parameters**:

- `userId`: User identifier

**Returns**: Array of TrackedCompany objects with embedded preference data

**Example**:

```typescript
const trackedCompanies = await UserCompanyPreferenceService.getTrackedCompanies(
	'user123',
);

trackedCompanies.forEach(company => {
	console.log(
		`${company.company}: Rank ${company.userPreference.rank}, ${company.userPreference.frequency}`,
	);
});
```

### getAllCompaniesWithPreferences(userId)

Gets all companies in the system with their tracking status for a specific user.

**Parameters**:

- `userId`: User identifier

**Returns**: Array of companies with optional preference data

**Use Case**: Building UI for company selection with current tracking status

### removeCompanyTracking(userId, companyId)

Disables tracking for a specific company without deleting the preference record.

**Parameters**:

- `userId`: User identifier
- `companyId`: Company ObjectId

**Returns**: Boolean success status

### updateCompanyRank(userId, companyId, rank)

Updates only the ranking for an existing preference.

**Parameters**:

- `userId`: User identifier
- `companyId`: Company ObjectId
- `rank`: New rank (1-100)

**Returns**: Updated preference document or null

### getTrackingStats(userId)

Provides summary statistics about a user's tracking preferences.

**Returns**: Object with tracking statistics

- `totalTracked`: Number of tracked companies
- `byFrequency`: Count grouped by scrape frequency
- `averageRank`: Average ranking of tracked companies

## Data Models

### TrackedCompany Interface

Extends the base Company model with embedded user preference data:

```typescript
interface TrackedCompany extends ICompany {
	userPreference: {
		rank: number;
		isTracking: boolean;
		frequency: string; // Human-readable like "Daily", "Every 3 days"
		lastUpdated: Date;
	};
}
```

### UserCompanyPreference Model

Core model for storing user preferences:

```typescript
interface IUserCompanyPreference {
	userId: string;
	companyId: ObjectId;
	rank: number; // 1-100
	isTracking: boolean;
	createdAt: Date;
	updatedAt: Date;
}
```

## Integration Points

### With Scheduling System

The service integrates with `scrapeScheduling.ts` utilities:

```typescript
import {getScrapeFrequencyDescription} from '../utils/scrapeScheduling';

// Automatic frequency calculation
const frequency = getScrapeFrequencyDescription(preference.rank);
```

### With Job Queue

The background job system uses this service to determine which companies to scrape:

```typescript
// Used by enqueueJobs.ts
const preferences = await UserCompanyPreference.find({isTracking: true});
```

### With Company Service

Validates company existence before creating preferences:

```typescript
const company = await Company.findById(companyId);
if (!company) throw new Error('Company not found');
```

## Error Handling

All methods include comprehensive error handling:

- Validation of rank ranges (1-100)
- Company existence verification
- Database operation error wrapping
- Detailed logging for debugging

## Performance Considerations

1. **Indexing**:

   - Compound index on `(userId, companyId)` for uniqueness
   - Performance index on `(userId, isTracking, rank)`

2. **Query Optimization**:

   - Population of company data only when needed
   - Sorting by rank for priority-based displays
   - Efficient map-based preference lookups

3. **Caching Opportunities**:
   - User preference data is good candidate for caching
   - Frequency descriptions can be cached/memoized

## Usage Patterns

### Basic Company Tracking

```typescript
// Add company to tracking
await UserCompanyPreferenceService.setCompanyPreference(
	userId,
	companyId,
	75, // Medium-high priority
);

// Get user's tracked companies
const tracked = await UserCompanyPreferenceService.getTrackedCompanies(userId);
```

### Bulk Operations

```typescript
// Add multiple companies
const companyIds = ['comp1', 'comp2', 'comp3'];
for (const companyId of companyIds) {
	await UserCompanyPreferenceService.setCompanyPreference(
		userId,
		companyId,
		50 + Math.random() * 40, // Random rank 50-90
	);
}
```

### UI Data Preparation

```typescript
// For company selection UI
const allCompanies =
	await UserCompanyPreferenceService.getAllCompaniesWithPreferences(userId);

// For dashboard stats
const stats = await UserCompanyPreferenceService.getTrackingStats(userId);
console.log(
	`Tracking ${stats.totalTracked} companies with average rank ${stats.averageRank}`,
);
```
