# Active Context

## Current Development Focus

### MongoDB Integration Layer

The project has established a MongoDB integration with a focus on:

- Type-safe operations through Mongoose
- Work model categorization (FULLY_REMOTE, HYBRID, IN_OFFICE)
- Flexible location tracking (headquarters + office locations)
- Efficient querying capabilities

## Active Patterns

### Data Architecture

```mermaid
theme dark
flowchart TD
    subgraph Company Structure
        C[Company] --> ID[companyID]
        C --> B[Basic Info]
        C --> L[Locations]
        C --> W[Work Model]
        C --> F[Fields]

        B --> |Contains| CN[company name]
        B --> |Contains| CU[careers_url]
        B --> |Contains| S[selector]

        L --> |Primary| HQ[headquarters]
        L --> |Additional| OL[office_locations]

        W --> |Enum| WM[FULLY_REMOTE/HYBRID/IN_OFFICE]

        F --> |Array| FT[field tags]
    end
```

## Key Implementation Decisions

### Work Model Implementation

- Using enum for work model to ensure type safety
- Replacing boolean remote_first with more nuanced work model
- Supporting hybrid and office-based scenarios

### Location Handling

- Storing headquarters as primary location
- Maintaining array of additional office locations
- Enabling location-based searches across both

### Query Optimization

- Case-insensitive location searches
- Flexible field matching
- Work model exact matching

## Current Usage Patterns

### Database Operations

```typescript
// Create company with work model and locations
await CompanyService.createCompany({
	companyID: 'company_example',
	company: 'Example Corp',
	work_model: WorkModel.FULLY_REMOTE,
	headquarters: 'Remote',
	office_locations: ['New York', 'London'],
});

// Find companies by location
await CompanyService.findCompaniesByLocation('New York');

// Find remote companies
await CompanyService.findCompaniesByWorkModel(WorkModel.FULLY_REMOTE);
```

## Active Considerations

### Scraping System

- Resilient content extraction with fallback strategies
- Detailed error logging for invalid selectors
- Company-specific error tracking
- Automated error report generation

### Performance

- MongoDB indexes on frequently queried fields
- Efficient query patterns for location searches
- Bulk operations for data seeding

### Data Integrity

- Required fields enforcement
- Work model validation
- Unique company ID constraint

### Extensibility

- Easy to add new company fields
- Flexible query methods
- Maintainable service layer

## Recent Learnings

### Best Practices

1. Use enums for fixed value sets
2. Implement flexible location tracking
3. Maintain type safety throughout
4. Provide comprehensive query methods

### Patterns to Follow

1. Separate model and service layers
2. Use static methods for service operations
3. Implement comprehensive error handling
   - Log detailed error context
   - Provide fallback behaviors
   - Track company-specific issues
4. Maintain clear documentation
5. Error resilience patterns:
   - Graceful fallback to full page content
   - Structured error logging
   - Company context preservation

### Recent System Enhancements

#### Enhanced Scraping System with Anti-Bot Measures

Recent improvements to handle protected sites:

1. Browser Stealth Configuration:

   - Disabled automation flags and infobar
   - Spoofed browser fingerprint
   - Realistic viewport and user agent
   - Common plugins and languages
   - Geolocation support

2. Human-like Interaction Patterns:

   - Random mouse movements
   - Natural scrolling behavior
   - Randomized delays between actions
   - Progressive content loading
   - Extended timeouts for protected sites

3. Error Handling and Recovery:
   - Multiple loading strategies
   - Automatic fallbacks
   - Detailed error logging
   - Progressive timeouts

Recent improvements to the scraping system include:

1. Smart context extraction for links:

   - Limited to 3 sibling elements before and after each link
   - Maximum 100 characters in each direction (200 total)
   - Removes duplicate link text mentions
   - Cleans up whitespace and newlines
   - Falls back to parent text only if immediate context is too short

2. Progressive page loading strategy for handling dynamic sites:
   - Configurable wait strategies (domcontentloaded, load, networkidle)
   - Automatic fallback through strategies on failure
   - Default 30s timeout with extended 60s timeout for networkidle
   - Custom timeout configuration per request
   - Improved error logging for debugging loading issues

```mermaid
theme dark
flowchart TD
    Start[Scrape Request] --> HasSelector{Has Selector?}

    HasSelector -->|Yes| TrySelector[Try Selector]
    HasSelector -->|No| FullPage[Scrape Full Page]

    TrySelector --> SelectorFound{Found?}
    SelectorFound -->|Yes| Extract[Extract Content]
    SelectorFound -->|No| Log[Log Error]

    Log --> CompanyInfo{Has Company Info?}
    CompanyInfo -->|Yes| ErrorReport[Create Error Report]
    CompanyInfo -->|No| Fallback[Use Fallback]

    ErrorReport --> Fallback
    Fallback --> FullPage

    FullPage --> URLs[Extract URLs]
    Extract --> URLs

    URLs --> Complete[Complete Request]
```

#### Error Handling Implementation

- Error log structure:
  ```typescript
  interface SelectorError {
  	company: string;
  	url: string;
  	selector: string;
  	error: string;
  	timestamp: string;
  }
  ```
- Stored in: `logs/selector-errors.json`
- Includes full context for debugging
- Automated file management
