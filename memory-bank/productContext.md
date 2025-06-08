# Product Context

## Purpose

Scoutly serves as a job listing aggregator with advanced scraping capabilities, storing company and job data with robust anti-bot measures.

## Core Functionality

### Data Management

- Company information storage
- Job listing aggregation
- Anti-bot scraping system
- RESTful API access

### Key Features

```mermaid
theme dark
flowchart LR
    S[Scraping] -->|Protected Sites| D[Data Layer]
    D -->|MongoDB| A[API Layer]
    A -->|Next.js| C[Client Layer]
```

## System Components

### Scraping System

- Browser stealth configuration
- Human-like interaction patterns
- Progressive loading strategies
- Detailed error tracking

### Data Layer

- MongoDB persistence
- Mongoose ODM
- Type-safe operations
- Flexible querying

### API Layer

- RESTful endpoints
- Companies API
- Jobs API
- Scrape API

## Integration Points

### External Systems

- MongoDB database
- Playwright browser
- Next.js frontend

### Internal Components

- Database models
- Service layer
- API routes
- Utility functions

## Success Metrics

### Reliability

- Successful scraping rate
- Error recovery
- Data consistency

### Performance

- Response times
- Query efficiency
- Scraping speed

### Maintainability

- Type safety
- Code organization
- Documentation quality
