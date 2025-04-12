# Technical Context

## Technology Stack

### Database

- MongoDB: Document database
- Mongoose: ODM (Object Data Modeling) for MongoDB
- Connection managed through environment variables

### Development Tools

- TypeScript: For type safety
- tsx: For running TypeScript scripts
- Docker and Docker Compose: For containerization
- Playwright: For web scraping

## Docker Configuration

### Container Architecture

```mermaid
theme dark
flowchart TD
    Client[Client] --> App[Next.js App Container]
    App --> MongoDB[(MongoDB Container)]

    subgraph Docker Environment
        App
        MongoDB
    end
```

### Development Setup

- Node.js 20 Alpine base image
- Hot reload enabled through volume mounts
- Automatic container health checks
- Persistent MongoDB storage
- Playwright with Chrome in Docker

### Browser Configuration

```typescript
const browserOptions = {
	headless: true,
	args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
	executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
};
```

### Container Communication

- Internal network: mongodb://mongodb:27017/scoutly
- Exposed ports:
  - App: 3000
  - MongoDB: 27017

### Docker Commands

```bash
# View application logs
docker compose logs -f app

# View database logs
docker compose logs -f mongodb

# Rebuild containers
docker compose up --build

# Stop and remove containers
docker compose down

# Stop and remove everything including volumes
docker compose down -v
```

## API Endpoints

### Companies API (`GET /api/companies`)

- Returns list of all companies in the database
- No parameters required
- Includes work models and locations

### Jobs API (`POST /api/jobs`)

```mermaid
theme dark
sequenceDiagram
    participant C as Client
    participant A as API
    participant S as Scraper
    participant G as Gemini API
    participant D as Database

    C->>A: POST /api/jobs
    A->>S: Scrape Website
    S-->>A: Raw Content
    A->>G: Extract Job Data
    G-->>A: Structured Data
    A->>D: Store Results
    A-->>C: Job Listings
```

### Scrape API (`POST /api/scrape`)

```mermaid
theme dark
sequenceDiagram
    participant C as Client
    participant A as API
    participant S as Scraper
    participant D as Database

    C->>A: POST /api/scrape
    A->>S: Scrape Website
    S-->>A: Content
    A-->>C: Scraped Data
```

## Error Handling

### Scraping Fallbacks

1. Try specific selector
2. Fall back to full page content if selector fails
3. Return error details in response

### CORS Configuration

```typescript
// Next.js API routes
headers: [
	{key: 'Access-Control-Allow-Credentials', value: 'true'},
	{key: 'Access-Control-Allow-Origin', value: '*'},
	{key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS'},
];
```

## Monitoring

### Log Access

- Application logs: `docker compose logs -f app`
- Database logs: `docker compose logs -f mongodb`
- Error tracking in src/logs directory

### Health Checks

- MongoDB ping verification
- App endpoint verification
- Automatic retry logic

## Development Workflow

### Local Setup

1. Install dependencies: `npm install`
2. Start containers: `docker compose up`
3. Seed database: `docker compose exec app npm run seed`
4. Monitor logs: `docker compose logs -f app`

### Deployment Considerations

- Configure environment variables
- Set up volume persistence
- Configure CORS as needed
- Monitor container health
