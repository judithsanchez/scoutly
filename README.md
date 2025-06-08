# Scoutly

A Next.js application for scraping and managing company job listings with MongoDB integration.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development without Docker)

## Getting Started with Docker

1. **Start the Application**:

```bash
# Start both the app and MongoDB
docker compose up

# Or run in background
docker compose up -d
```

2. **Seed the Database**:

```bash
docker compose exec app npm run seed
```

The application will be available at [http://localhost:3000](http://localhost:3000) with MongoDB running at mongodb://localhost:27017/scoutly.

## Monitoring and Debugging

### View Container Logs

```bash
# View application logs
docker compose logs -f app

# View database logs
docker compose logs -f mongodb

# View all container logs
docker compose logs -f
```

### Common Issues and Solutions

1. **Scraping fails with selector error**:

   - Check if the selector exists on the page
   - The system will fall back to full page content
   - Check logs for detailed error messages

2. **MongoDB connection issues**:

   - Ensure MongoDB container is healthy: `docker compose ps`
   - Check MongoDB logs: `docker compose logs mongodb`
   - Verify connection string in environment variables

3. **Container startup issues**:
   - Remove containers and volumes: `docker compose down -v`
   - Rebuild containers: `docker compose up --build`
   - Check logs for startup errors

## API Endpoints

### Companies API

`GET /api/companies`

- Returns list of all companies in the database
- Response:

```json
[
	{
		"companyID": "example",
		"company": "Example Corp",
		"careers_url": "https://example.com/careers",
		"selector": ".jobs-container",
		"work_model": "FULLY_REMOTE",
		"headquarters": "San Francisco, USA",
		"office_locations": ["New York, USA"],
		"fields": ["software", "technology"]
	}
]
```

### Jobs API

`POST /api/jobs`

- Scrapes job listings from a given URL and extracts structured data
- Request Body:

```json
{
	"url": "https://example.com/careers",
	"selector": ".jobs-container", // Optional, defaults to .search-results
	"companyName": "Example Corp", // Optional
	"cleanHtml": true, // Optional
	"textOnly": false, // Optional
	"includeMetadata": true, // Optional
	"autoDetectContent": true, // Optional
	"includeLinks": true // Optional
}
```

- Response:

```json
{
  "scrapeResult": {
    "content": "...",
    "metadata": { ... },
    "pagination": { ... }
  },
  "jobData": {
    "openPositions": [
      {
        "title": "Software Engineer",
        "url": "https://example.com/jobs/software-engineer"
      }
    ]
  }
}
```

### Scrape API

`POST /api/scrape`

- Generic web scraping endpoint
- Request Body:

```json
{
	"url": "https://example.com",
	"selector": ".content",
	"company": "Example Corp"
}
```

- Response:

```json
{
	"content": "Scraped content...",
	"links": [
		{
			"url": "https://example.com/job",
			"text": "Job Title",
			"context": "Relevant surrounding text...",
			"isExternal": false
		}
	],
	"metadata": {
		"url": "https://example.com",
		"title": "Page Title",
		"description": "Page description",
		"scrapedAt": "2025-04-12T..."
	}
}
```

Note about context extraction:

- Limited to 3 adjacent elements before and after each link
- Maximum of 100 characters in each direction
- Automatically cleans up whitespace and removes duplicates
- Includes only relevant surrounding text for better context

## Development Commands

```bash
# Rebuild containers after changes
docker compose up --build

# View logs
docker compose logs -f

# Stop containers
docker compose down

# Stop and remove volumes
docker compose down -v
```

## Development without Docker

1. Install dependencies:

```bash
npm install
```

2. Set up MongoDB locally or update MONGODB_URI in .env

3. Run the development server:

```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/scoutly
```

When using Docker, these variables are automatically configured in the docker-compose.yml file.

## Project Structure

```
src/
├── app/
│   └── api/            # API routes
├── config/            # Configuration files
├── models/           # Database models
├── services/         # Business logic
├── utils/           # Utility functions
└── scripts/         # Database scripts
```
