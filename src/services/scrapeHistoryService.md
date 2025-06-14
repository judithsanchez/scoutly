# Scrape History Service

## Overview

The ScrapeHistoryService manages the tracking and comparison of job listings across multiple scraping sessions. It helps identify new job postings by maintaining a history of previously seen URLs for each company and user combination.

## Architecture

See [scrapeHistoryService.mmd](./scrapeHistoryService.mmd) for the complete flow diagram.

## Core Features

1. **History Tracking**

   - Records scrape timestamps
   - Stores link metadata
   - Maintains user-specific history

2. **Link Comparison**

   - Detects new job postings
   - Filters duplicate URLs
   - Validates link data

3. **Data Persistence**
   - MongoDB integration
   - Upsert operations
   - Efficient querying

## Data Models

### Scrape Link

```typescript
interface ScrapeLink {
	url: string;
	text: string;
	context: string;
	title?: string;
}
```

### Scrape History Record

```typescript
interface ICompanyScrapeHistory {
	companyId: mongoose.Types.ObjectId;
	userEmail: string;
	lastScrapeDate: Date;
	links: ScrapeLink[];
}
```

## Core Methods

### Get Last Scrape

```typescript
static async getLastScrape(
  companyId: string,
  userEmail: string,
): Promise<ICompanyScrapeHistory | null>
```

Retrieves the most recent scrape history for a specific company and user combination.

#### Parameters

- `companyId`: Company identifier
- `userEmail`: User's email address

#### Returns

- The last scrape record or null if no history exists

### Record Scrape

```typescript
static async recordScrape(
  companyId: string,
  userEmail: string,
  links: ExtractedLink[],
): Promise<ICompanyScrapeHistory>
```

Records a new scrape session with extracted links.

#### Parameters

- `companyId`: Company identifier
- `userEmail`: User's email address
- `links`: Array of extracted links with metadata

#### Returns

- Updated scrape history record

### Find New Links

```typescript
static async findNewLinks(
  companyId: string,
  userEmail: string,
  currentLinks: ExtractedLink[],
): Promise<string[]>
```

Compares current links against historical data to identify new URLs.

#### Parameters

- `companyId`: Company identifier
- `userEmail`: User's email address
- `currentLinks`: Recently extracted links to compare

#### Returns

- Array of new URLs not present in previous scrapes

## Data Handling

### Link Processing

```typescript
const scrapeLinks = links.map(link => ({
	url: String(link.url),
	text: String(link.text || ''),
	context: String(link.context || ''),
	title: link.title ? String(link.title) : undefined,
}));
```

The service ensures data consistency by:

- Converting all fields to strings
- Handling missing optional fields
- Maintaining data structure integrity

### Database Operations

#### Update Strategy

```typescript
const update = {
	companyId: objectId,
	userEmail,
	lastScrapeDate: new Date(),
	links: scrapeLinks,
};

// Upsert operation
await CompanyScrapeHistory.findOneAndUpdate(
	{companyId: objectId, userEmail},
	update,
	{upsert: true, new: true},
);
```

- Uses upsert to handle both new and existing records
- Updates timestamp automatically
- Maintains atomic operations

## Error Handling

### Error Categories

1. **Database Errors**

   - Connection issues
   - Query failures
   - Validation errors

2. **Data Validation**

   - Invalid company IDs
   - Malformed URLs
   - Missing required fields

3. **Type Conversion**
   - ObjectId conversion
   - String normalization
   - Date parsing

### Error Responses

All methods wrap errors with context:

```typescript
try {
	// Operation
} catch (error: any) {
	throw new Error(`Error context: ${error.message}`);
}
```

## Integration Points

### Models

- `CompanyScrapeHistory`: Database model
- `ExtractedLink`: Link data structure from scraper

### Services

- Logging service for operation tracking
- MongoDB for data persistence
- Job Matching Orchestrator integration

## Best Practices

### 1. Data Validation

- Always validate company IDs
- Ensure URL strings are properly formatted
- Check for required fields

### 2. Error Handling

- Use descriptive error messages
- Implement proper error wrapping
- Log error details

### 3. Performance

- Use efficient queries
- Implement proper indexing
- Batch operations when possible

## Common Usage Patterns

### Basic Flow

```typescript
// 1. Get last scrape to check history
const lastScrape = await ScrapeHistoryService.getLastScrape(
	companyId,
	userEmail,
);

// 2. Compare with current links
const newLinks = await ScrapeHistoryService.findNewLinks(
	companyId,
	userEmail,
	currentLinks,
);

// 3. Record new scrape
await ScrapeHistoryService.recordScrape(companyId, userEmail, currentLinks);
```

### Batch Processing

```typescript
// Process multiple companies
async function processBatch(companies: Company[], userEmail: string) {
	for (const company of companies) {
		const newLinks = await ScrapeHistoryService.findNewLinks(
			company.id,
			userEmail,
			company.currentLinks,
		);

		if (newLinks.length > 0) {
			// Process new links
			await processNewLinks(newLinks);
		}

		// Update history
		await ScrapeHistoryService.recordScrape(
			company.id,
			userEmail,
			company.currentLinks,
		);
	}
}
```

## Performance Considerations

1. **Database Optimization**

   - Index on {companyId, userEmail}
   - Regular cleanup of old records
   - Batch operations for multiple records

2. **Memory Management**

   - Efficient URL set comparisons
   - Stream large result sets
   - Clear unused references

3. **Query Optimization**
   - Use lean queries when possible
   - Implement proper projections
   - Minimize database roundtrips

## Monitoring

### Key Metrics

- New URLs detected per scrape
- Processing time per operation
- Error rates and types
- Database operation latency

### Logging

```typescript
const logger = new Logger('ScrapeHistoryService');

// Operation tracking
logger.info('Processing new scrape', {companyId, linkCount});
logger.debug('Found new links', {count: newLinks.length});
logger.error('Error during scrape', error);
```

## Future Improvements

1. **Scalability**

   - Implement caching layer
   - Add bulk operations
   - Optimize large datasets

2. **Features**

   - Add link metadata tracking
   - Implement change detection
   - Add historical trends

3. **Maintenance**
   - Add data cleanup jobs
   - Implement archival strategy
   - Add monitoring dashboard
