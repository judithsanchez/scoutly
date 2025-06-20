# Scoutly

A Next.js application for intelligent job aggregation with AI-powered matching, web scraping, and comprehensive job management capabilities.

## ✨ Current Status (June 2025)

🎉 **Fully Functional & Production Ready**

- ✅ All 69 tests passing in Docker environment
- ✅ Zero TypeScript compilation errors
- ✅ Complete end-to-end job matching workflow
- ✅ Simplified architecture with enhanced reliability

## 🚀 Key Features

### Job Intelligence

- **AI-Powered Matching**: Gemini AI analyzes job fit against user profiles
- **Smart Scraping**: Automated job discovery from company career pages
- **Comprehensive Analysis**: Detailed scoring, reasoning, and recommendations
- **Token Tracking**: Monitor AI API usage and costs

### User Experience

- **Company Tracking**: Follow multiple companies for new opportunities
- **Job Management**: Save, categorize, and track application status
- **Rich Job Data**: Technology requirements, salary, visa sponsorship info
- **Instant Results**: Direct execution without queue delays

### Technical Excellence

- **Type-Safe**: Full TypeScript coverage with zero compilation errors
- **Well-Tested**: Comprehensive test suite with 69 passing tests
- **Docker Ready**: Fully containerized development and deployment
- **Performance Optimized**: Efficient scraping and AI processing

## Authentication Setup

### 1. Install Dependencies

```bash
npm install next-auth@latest @auth/core @auth/mongodb-adapter mongodb --legacy-peer-deps
```

### 2. Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application"
6. Set authorized origins:
   ```
   http://localhost:3000
   ```
7. Set authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
8. Copy the generated Client ID and Client Secret

### 3. Environment Setup

1. Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   # or
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
2. Update .env file:
   ```
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-generated-secret"
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

## 🛠️ Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

### Development Setup

```bash
# Clone and start the application
git clone <repository-url>
cd scoutly

# Start all services with Docker
docker compose up -d

# Seed the database with companies
docker compose exec app npx tsx src/scripts/seedCompanies.ts

# View application
open http://localhost:3000
```

### Validation Commands

```bash
# Quick validation (lint + type-check + tests)
npm run validate:docker

# Full validation including build
npm run validate:full:docker

# Run tests only
docker compose exec app npm test
```

## 🏗️ Architecture Overview

### Simplified Direct Execution Model

- **No Background Jobs**: Job matching happens synchronously during API calls
- **Immediate Results**: Users get instant feedback without queue delays
- **Pipeline Architecture**: Modular steps for scraping, analysis, and storage
- **Direct Database Operations**: Simplified data management without job queues

### Core Workflow

1. **User Setup**: Create account and select companies to track
2. **Job Discovery**: Scrape career pages for new opportunities
3. **AI Analysis**: Gemini AI evaluates job fit against user profile
4. **Smart Filtering**: Save only relevant jobs with detailed analysis
5. **Job Management**: Track application status and notes

## 📋 Recent Major Updates (June 2025)

### Background Jobs Refactor ✅

- **Removed**: Complex queue infrastructure and background processing
- **Simplified**: Direct execution model for immediate results
- **Maintained**: All functionality while reducing complexity
- **Improved**: Reliability, maintainability, and debugging

### Quality Improvements ✅

- **Test Suite**: 69 comprehensive tests all passing in Docker
- **Type Safety**: Zero TypeScript compilation errors
- **Documentation**: Updated component and service documentation
- **Performance**: Optimized for direct execution model
  docker compose exec app npm run db:seed

````

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
````

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
