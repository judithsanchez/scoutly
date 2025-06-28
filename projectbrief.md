# Project Brief: Scoutly

## Overview

A job listing aggregator with advanced scraping capabilities and MongoDB integration. Features AI-powered job matching, intelligent filtering, and comprehensive tracking of job opportunities from multiple companies.

## Architecture

### Current State (June 2025)

- **Simplified Architecture**: Direct execution model without background job queues
- **AI Integration**: Gemini API for intelligent job analysis and matching
- **User Preferences**: Tracked companies stored as simple array on User model
- **Synchronous Processing**: Job matching happens during API calls for immediate results

### Core Features

- **Company Tracking**: Users can track multiple companies for job opportunities
- **Intelligent Scraping**: Web scraping with duplicate detection and history tracking
- **AI Job Matching**: Advanced analysis of job fit based on user preferences and CV
- **Job Management**: Save, categorize, and track application status for matched jobs
- **Token Usage Tracking**: Monitor and log AI API usage per user and operation

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

### Docker Commands

```bash
# Start the application
docker compose up -d

# View logs
docker compose logs -f app

# Stop the application
docker compose down

# Rebuild after changes
docker compose build app
docker compose up -d

# Seed the database
docker compose exec app npx tsx src/scripts/seedCompanies.ts

# Clear scrape history (allows re-scraping companies)
docker compose exec app npx tsx src/scripts/clearScrapeHistory.ts

# Clear specific data (more options)
docker compose exec app npx tsx src/scripts/clearData.ts --help
```

## Pre-Push Validation Commands

Validate your code before pushing changes:

```bash
# Quick validation (lint + type-check + tests)
npm run validate:docker

# Full validation including build
npm run validate:full:docker

# Quick check (lint + type-check only)
npm run quick-check:docker
```

See `/TODOS/pre-push-validation-commands.md` for complete documentation.

## Database Management

### Clear Scrape History

When companies show "0 new jobs", it's because they've been scraped before. Clear the scrape history to allow re-scraping:

```bash
# Quick way - clear all scrape history
docker compose exec app npx tsx src/scripts/clearScrapeHistory.ts

# Or use the detailed script
docker compose exec app npx tsx src/scripts/clearData.ts --scrape-history
```

### Clear Saved Jobs

Remove saved jobs for testing or cleanup:

```bash
# Clear saved jobs for specific user
docker compose exec app npx tsx src/scripts/clearData.ts --saved-jobs --user judithv.sanchezc@gmail.com

# Clear all saved jobs
docker compose exec app npx tsx src/scripts/clearData.ts --saved-jobs --all

# Clear everything (scrape history + all saved jobs)
docker compose exec app npx tsx src/scripts/clearData.ts --all
```

## API Endpoints

### POST /api/users

Creates a new user with no tracked companies by default. Users must explicitly choose which companies to track. No authentication currently implemented.

```json
{
	"email": "user@example.com"
}
```

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

```

**Note**: New users are created with an empty list of tracked companies. Users must explicitly add companies they want to track using the user preferences API.

### POST /api/jobs

Searches for jobs. No authentication currently implemented.

Request body:

```json
{
  "credentials": {
    "gmail": "user@gmail.com"
  },
  "companyIds": ["company1", "company2"],
  "cvUrl": "https://drive.google.com/file/...",
  "candidateInfo": {
    "logistics": {
      "currentResidence": {
        "city": "City",
        "country": "Country",
        "countryCode": "CC",
        "timezone": "Region/City"
      },
      "willingToRelocate": boolean,
      "workAuthorization": [
        {
          "region": "Region",
          "regionCode": "RC",
          "status": "Status"
        }
      ]
    },
    "languages": [
      {
        "language": "Language",
        "level": "Level"
      }
    ],
    "preferences": {
      "careerGoals": ["goal1", "goal2"],
      "jobTypes": ["type1", "type2"],
      "workEnvironments": ["env1", "env2"],
      "companySizes": ["size1", "size2"],
      "exclusions": {
        "industries": ["ind1", "ind2"],
        "technologies": ["tech1", "tech2"],
        "roleTypes": ["role1", "role2"]
      }
    }
  }
}
```

## Technical Stack

- **Frontend**: Next.js with TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **AI**: Google Gemini API for job analysis and matching
- **Scraping**: Playwright for reliable web scraping
- **Testing**: Vitest with comprehensive test coverage (69 tests across 13 files)
- **Containerization**: Docker and Docker Compose for development and deployment
- **Type Safety**: Full TypeScript coverage with zero compilation errors

## Recent Major Updates (June 2025)

### Background Jobs Refactor ✅

- **Removed**: Complex queue infrastructure and background job processing
- **Simplified**: Direct execution model for immediate results
- **Maintained**: All core functionality while reducing system complexity
- **Improved**: Code maintainability and debugging capabilities

### Quality Improvements ✅

- **Test Coverage**: Complete test suite with 69 passing tests
- **Type Safety**: Zero TypeScript compilation errors
- **Code Quality**: All linting checks passing
- **Documentation**: Updated component-level documentation

### Architecture Benefits

- **Faster Response Times**: No queue delays, immediate job processing
- **Simplified Debugging**: Direct execution path easier to trace
- **Reduced Resource Usage**: No background workers needed
- **Better Reliability**: Fewer moving parts, more predictable behavior

- All user identity is now session-based (from NextAuth), not environment-based. This ensures robust, secure, and production-ready authentication.

**Note**: Only real authentication is supported. Dev auth mode is not available.
