# Job Matching Orchestrator

## Overview

The JobMatchingOrchestrator is a sophisticated service that automates the job matching process by combining web scraping, AI analysis, and intelligent scoring. It processes multiple company career pages in parallel, analyzes job postings against candidate profiles, and provides detailed suitability assessments.

## Architecture

See [jobMatchingOrchestrator.mmd](./jobMatchingOrchestrator.mmd) for the complete flow diagram.

## Core Features

1. **Parallel Company Processing**

   - Process up to 10 companies simultaneously
   - Intelligent browser resource management
   - Rate limiting and token usage tracking

2. **Smart Scraping**

   - Concurrent browser instances (max 3)
   - Automatic retry logic
   - Progressive loading strategies
   - Intelligent link filtering

3. **AI-Powered Analysis**

   - Two-phase matching process (initial + deep dive)
   - Structured output with scoring
   - Rate limit compliance
   - Token usage optimization

4. **Resource Management**
   - Automatic cleanup
   - Memory optimization
   - Browser instance pooling
   - Database connection handling

## Configuration

```typescript
interface JobMatchingConfig {
	MODEL_NAME: string; // AI model identifier
	BATCH_SIZE: number; // Number of jobs per batch
	MAX_PARALLEL_COMPANIES: 10; // Maximum companies to process
	MAX_BROWSERS: 3; // Maximum concurrent browser instances
}
```

### Rate Limits

```typescript
interface IGeminiRateLimit {
	modelName: string;
	rpm: number | null; // Requests per minute
	rpd: number | null; // Requests per day
	tpm: number | null; // Tokens per minute
}
```

## Usage

### Basic Job Matching

```typescript
const orchestrator = new JobMatchingOrchestrator();

// Single company processing
const results = await orchestrator.orchestrateJobMatching(
	company,
	cvUrl,
	candidateInfo,
	userEmail,
);

// Multiple companies
const batchResults = await orchestrator.orchestrateBatchJobMatching(
	companies,
	cvUrl,
	candidateInfo,
	userEmail,
);
```

### Input Types

#### Candidate Information

```typescript
interface CandidateInfo {
	skills: string[];
	experience: {
		years: number;
		roles: string[];
	};
	preferences: {
		locations: string[];
		remoteOnly?: boolean;
		salary?: {
			minimum: number;
			currency: string;
		};
	};
}
```

#### Company Definition

```typescript
interface ICompany {
	id: string;
	company: string;
	careers_url: string;
	// ... other company fields
}
```

## Process Phases

### 1. Initial Scraping

- Parallel processing of company career pages
- Link extraction and filtering
- New job detection through scrape history

### 2. CV Processing

- PDF download and text extraction
- Candidate profile XML conversion
- Content optimization for AI analysis

### 3. Initial Matching

- Batch analysis of extracted jobs
- Preliminary filtering based on basic criteria
- Structured output generation

### 4. Deep Dive Analysis

- Detailed content scraping for matched positions
- Comprehensive analysis with scoring
- Batch processing for efficiency

### 5. Results Processing

- Database storage of matched positions
- Company-wise grouping
- User profile updates

## Error Handling

### Retry Strategies

```typescript
const MAX_RETRIES = 5;
const MIN_RETRY_DELAY = 2000; // 2s
const MAX_RETRY_DELAY = 30000; // 30s
```

### Error Categories

1. **Scraping Errors**

   - Network failures
   - Invalid URLs
   - Rate limiting
   - Parse failures

2. **AI Processing Errors**

   - Token limits
   - Model errors
   - Invalid responses

3. **Resource Errors**
   - Browser instance limits
   - Memory constraints
   - Database connection issues

## Performance Optimization

### Browser Management

- Concurrent instance limiting
- Resource pooling
- Automatic cleanup
- Memory optimization

### AI Processing

- Batch processing
- Token usage tracking
- Rate limit monitoring
- Response caching

### Database Operations

- Bulk inserts
- Duplicate detection
- Efficient querying
- Connection pooling

## Monitoring

### Token Usage Tracking

```typescript
interface TokenUsage {
	processId: string;
	operation: TokenOperation;
	estimatedTokens: number;
	actualTokens: number;
	inputTokens: number;
	outputTokens: number;
	costEstimate: {
		input: number;
		output: number;
		total: number;
		currency: string;
		isFreeUsage: boolean;
	};
}
```

### Key Metrics

- Token usage per minute/day
- Request rates
- Processing times
- Success/failure rates
- Browser instance usage

## Integration Points

### External Services

1. **Google Gemini AI**

   - Model: gemini-2.0-flash-lite
   - Function calling
   - Rate limiting

2. **Web Scraper**

   - Playwright integration
   - Concurrent browsing
   - Resource management

3. **Database Services**
   - Job storage
   - User updates
   - Company tracking

### Internal Services

1. **ScrapeHistoryService**

   - Track processed URLs
   - Detect new positions
   - Maintain history

2. **TokenUsageService**

   - Monitor usage
   - Cost tracking
   - Rate limiting

3. **UserService**
   - Profile management
   - Job preferences
   - Application tracking

## Best Practices

### 1. Resource Management

```typescript
try {
  // Initialize resources
  await orchestrator.initializeResources();

  // Process jobs
  await orchestrator.processBatchCompanies(...);

} finally {
  // Always cleanup
  await orchestrator.cleanup();
}
```

### 2. Error Recovery

- Implement exponential backoff
- Maintain partial results
- Log detailed errors
- Clean up resources

### 3. Monitoring

- Track token usage
- Monitor rate limits
- Log processing times
- Record error rates

## Common Issues and Solutions

### 1. Rate Limiting

- **Issue**: Hitting API rate limits
- **Solution**: Implement token bucket algorithm

```typescript
await checkRateLimits();
// Proceed with API call
```

### 2. Memory Management

- **Issue**: Browser instance memory growth
- **Solution**: Implement cleanup and pooling

```typescript
// Release browser resources
releaseBrowser();
```

### 3. Failed Scrapes

- **Issue**: Invalid or blocked URLs
- **Solution**: Implement retry with backoff

```typescript
while (attempts < maxAttempts) {
	try {
		return await scrapeWebsite(url);
	} catch (error) {
		await exponentialBackoff(attempts);
	}
}
```

## Security Considerations

1. **URL Validation**

   - Sanitize input URLs
   - Validate domains
   - Check for malicious patterns

2. **Resource Protection**

   - Implement timeouts
   - Monitor usage
   - Prevent abuse

3. **Data Privacy**
   - Secure CV handling
   - Clean up temporary files
   - Encrypt sensitive data

## Future Improvements

1. **Performance**

   - Implement caching layer
   - Optimize batch sizes
   - Improve parallel processing

2. **Resilience**

   - Add circuit breakers
   - Implement fallback strategies
   - Enhanced monitoring

3. **Scalability**
   - Distributed processing
   - Load balancing
   - Resource pooling
