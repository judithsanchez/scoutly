# Scrape Scheduling Utility

## Overview

The scrape scheduling utility provides intelligent scheduling logic for the background jobs system. It calculates scrape intervals based on user-assigned company rankings and supports both traditional cron and anacron-based scheduling for intermittent systems.

## Core Functions

### getScrapeInterval(rank: number)

Calculates the appropriate scrape interval in milliseconds based on company rank.

**Ranking System**:

- Ranks 81-100: Daily (24 hours) - Highest priority companies
- Ranks 61-80: Every 2 days
- Ranks 31-60: Every 3 days
- Ranks 11-30: Every 4 days
- Ranks 1-10: Every 5 days - Lowest priority companies

**Parameters**:

- `rank`: Company rank from 1-100 (100 = highest priority)

**Returns**: Interval in milliseconds

**Example**:

```typescript
const interval = getScrapeInterval(95); // Returns 86400000 (24 hours)
const interval = getScrapeInterval(25); // Returns 345600000 (4 days)
```

### calculateAnacronPriority(rank: number, lastScrapedAt: Date | null)

Calculates priority score for anacron scheduling, combining company rank with how overdue the scrape is.

**Parameters**:

- `rank`: Company rank from 1-100
- `lastScrapedAt`: Date of last successful scrape (null if never scraped)

**Returns**: Priority score (higher = more urgent)

**Algorithm**:

- Base priority = company rank
- If overdue, multiply by overdue factor
- Never-scraped companies get base rank priority

### isCompanyDueForScraping(rank: number, lastScrapedAt: Date | null)

Simple boolean check if a company should be scraped based on its schedule.

**Parameters**:

- `rank`: Company rank from 1-100
- `lastScrapedAt`: Date of last successful scrape

**Returns**: `true` if company should be scraped

### getScrapeFrequencyDescription(rank: number)

Provides human-readable description of scrape frequency for UI display.

**Parameters**:

- `rank`: Company rank from 1-100

**Returns**: String like "Daily", "Every 3 days", etc.

## Usage Patterns

### Basic Scheduling Check

```typescript
import {isCompanyDueForScraping, getScrapeInterval} from './scrapeScheduling';

const company = await Company.findById(companyId);
const userPref = await UserCompanyPreference.findOne({
	userId,
	companyId: company._id,
});

if (isCompanyDueForScraping(userPref.rank, company.lastSuccessfulScrape)) {
	// Queue company for scraping
}
```

### Anacron Priority Sorting

```typescript
import {calculateAnacronPriority} from './scrapeScheduling';

const companies = await getTrackedCompanies(userId);
const companiesWithPriority = companies.map(company => ({
	...company,
	anacronPriority: calculateAnacronPriority(
		company.userPreference.rank,
		company.lastSuccessfulScrape,
	),
}));

// Sort by priority (highest first)
companiesWithPriority.sort((a, b) => b.anacronPriority - a.anacronPriority);
```

### UI Frequency Display

```typescript
import {getScrapeFrequencyDescription} from './scrapeScheduling';

const frequency = getScrapeFrequencyDescription(userRank); // "Daily" or "Every 3 days"
```

## Integration with Anacron

The utility is designed to work with anacron for systems that aren't always on:

1. **System Startup**: Calculate priorities for all tracked companies
2. **Priority Queue**: Sort companies by anacron priority
3. **Batch Processing**: Process highest priority companies first
4. **Resource Management**: Adjust batch size based on system resources

## Error Handling

- Invalid rank values (outside 1-100) throw descriptive errors
- Null/undefined dates are handled gracefully
- All calculations use safe integer arithmetic

## Performance Considerations

- All calculations are O(1) time complexity
- No database calls within utility functions
- Minimal memory footprint for large company lists
- Optimized for frequent calls during scheduling
