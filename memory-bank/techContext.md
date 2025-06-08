# Technical Context

## Technology Stack

### Core Technologies

- Next.js 14+
- TypeScript
- MongoDB & Mongoose
- Docker & Docker Compose
- Playwright

## Development Environment

### Docker Configuration

```mermaid
theme dark
flowchart TD
    subgraph Docker Environment
        App[Next.js App] --> MongoDB[(MongoDB)]
        App --> Playwright[Playwright Browser]
    end
```

### Key Components

- Node.js 20 Alpine base image
- MongoDB for persistence
- Playwright for scraping
- Automatic container health checks

## Anti-Bot Measures

### Browser Configuration

- Disabled automation flags
- Spoofed fingerprint
- Human-like behavior patterns
- Stealth plugin integration

### Scraping Strategy

- Progressive loading
- Random delays
- Natural scrolling
- Extended timeouts
- Multiple fallbacks

## API Structure

### Endpoints

1. Companies API: `/api/companies`

   - Company listing
   - Data management

2. Jobs API: `/api/jobs`

   - Job scraping
   - Data extraction

3. Scrape API: `/api/scrape`
   - Generic scraping
   - Error handling

## Development Commands

```bash
# Start containers
docker compose up -d

# View logs
docker compose logs -f

# Seed database
docker compose exec app npm run seed
```

## Error Handling

### Logging System

- Structured error logs
- Company-specific tracking
- Automated reporting
- Fallback strategies

### Error Types

- Scraping failures
- Database errors
- API errors
- Validation errors
