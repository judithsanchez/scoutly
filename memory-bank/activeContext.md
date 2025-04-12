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

#### Enhanced Scraping System

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
