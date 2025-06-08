# Scoutly

A Next.js application for scraping and managing job listings with advanced anti-bot measures and MongoDB integration.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

### Quick Start

```bash
# Start containers
docker compose up -d

# Seed database
docker compose exec app npm run seed
```

Application: [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Companies API

`GET /api/companies`

- Returns list of all companies

### Jobs API

`POST /api/jobs`

- Scrapes and processes job listings
- Supports custom selectors and filters

### Scrape API

`POST /api/scrape`

- Generic web scraping with anti-bot measures
- Supports progressive loading and fallbacks

## Development

### Commands

```bash
# View logs
docker compose logs -f

# Rebuild containers
docker compose up --build

# Reset environment
docker compose down -v
```

### Local Setup

1. Install dependencies: `npm install`
2. Configure environment: Copy `.env.example` to `.env`
3. Start development: `npm run dev`

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
