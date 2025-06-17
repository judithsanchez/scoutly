# Project Brief: Scoutly

## Overview

A job listing aggregator with advanced scraping capabilities and MongoDB integration.

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

Creates a new user. No authentication currently implemented.

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

- Next.js with TypeScript
- MongoDB & Mongoose
- Playwright for scraping
- Docker for containerization
