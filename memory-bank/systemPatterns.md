# System Patterns

## Architecture Overview

```mermaid
theme dark
flowchart TD
    Client[Next.js Client] --> API[API Routes]
    API --> Services[Services Layer]
    Services --> Models[Models Layer]
    Models --> DB[(MongoDB)]

    API --> Scraper[Scraper Service]
    Scraper --> Site[Target Sites]
```

## Core Patterns

### Repository Pattern

```typescript
// CompanyService encapsulates data access
class CompanyService {
	static async findByWorkModel(model: WorkModel): Promise<ICompany[]>;
	static async findByLocation(location: string): Promise<ICompany[]>;
}
```

### Scraping Pattern

```mermaid
theme dark
flowchart LR
    subgraph Scraping Flow
        Init[Initialize] --> Stealth[Configure Stealth]
        Stealth --> Load[Load Page]
        Load --> Extract[Extract Data]
        Extract --> Error{Error?}
        Error -->|Yes| Fallback[Use Fallback]
        Error -->|No| Complete[Return Data]
    end
```

## Error Handling

### Scraping Errors

- Progressive fallback strategies
- Detailed error logging
- Company-specific tracking
- Automated reporting

### API Errors

- Type-safe error responses
- Consistent error format
- Detailed error context

## Data Flow

### API Routes

1. `/api/companies`: Company management
2. `/api/jobs`: Job listing operations
3. `/api/scrape`: Generic scraping

### Service Layer

- Business logic isolation
- Type-safe operations
- Error transformation
- Query optimization

## Project Structure

```
src/
├── app/          # Next.js app
├── components/   # React components
├── config/       # Configuration
├── models/       # Database models
├── services/     # Business logic
└── utils/        # Utilities
```
