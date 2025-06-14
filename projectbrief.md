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
