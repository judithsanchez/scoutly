# Job Matching Orchestrator

## Overview

The JobMatchingOrchestrator is a sophisticated service that automates the job matching process by combining web scraping, AI analysis, and intelligent scoring. It processes multiple company career pages, analyzes job postings against candidate profiles, and provides detailed suitability assessments.

**UPDATED**: As of June 2025, operates with a **simplified direct execution model** without background job queues, providing immediate results and enhanced reliability.

## Architecture

### Current Architecture (Post-Refactor)

The orchestrator now operates with a **direct execution model**:

1. **Synchronous Processing**: All job matching happens during API calls
2. **Pipeline-Based Steps**: Modular, step-based processing with shared context
3. **Immediate Results**: No queue delays, results available immediately
4. **Simplified State Management**: Direct database operations without job queues
5. **Enhanced Error Handling**: Better error recovery and user feedback

### Key Benefits of Refactored Architecture

- **Faster Response Times**: No queue delays, immediate job processing
- **Simplified Debugging**: Direct execution path easier to trace
- **Reduced Resource Usage**: No background workers needed
- **Better Reliability**: Fewer moving parts, more predictable behavior
- **Improved Maintainability**: Cleaner code structure, easier to understand

## Processing Pipeline

The orchestrator processes jobs through a series of modular steps:

1. **CandidateProfileStep**: Process candidate information and preferences
2. **CvProcessingStep**: Download and extract CV content for analysis
3. **CompanyScrapingStep**: Scrape job listings and filter new opportunities
4. **InitialMatchingStep**: AI-powered initial job filtering and scoring
5. **JobDetailsStep**: Fetch detailed job descriptions from career pages
6. **DeepAnalysisStep**: Detailed AI scoring and fit analysis
7. **ResultsStorageStep**: Save matched jobs with analysis to database

Each step operates on shared context and can handle errors gracefully with appropriate fallbacks.

## Recent Major Updates (June 2025)

### Pipeline Integration (June 2025)

#### Phase 4: Pipeline Architecture Implementation

- **Pipeline Infrastructure**: Created complete pipeline system with 7 modular steps

### Background Jobs Refactor ✅

- **Removed**: Complex queue infrastructure and background job processing
- **Simplified**: Direct execution model for immediate results during API calls
- **Maintained**: All core functionality while reducing system complexity
- **Improved**: Code maintainability, debugging capabilities, and reliability

### Architecture Modernization ✅

- **Pipeline Architecture**: Modular step-based processing with shared context
- **Direct Database Operations**: Eliminated queue-based state management
- **Synchronous Processing**: Job matching completes before API response
- **Enhanced Error Handling**: Better error recovery and user feedback

### Quality Improvements ✅

- **Test Coverage**: Comprehensive test suite with all scenarios covered
- **Type Safety**: Full TypeScript coverage with zero compilation errors
- **Documentation**: Updated to reflect current architecture and capabilities
- **Performance**: Optimized for direct execution without queue overhead

## Core Features

1. **Direct Company Processing**

   - Process companies synchronously during API calls
   - Immediate results without queue delays
   - Intelligent resource management and cleanup
   - Rate limiting and token usage tracking

2. **Smart Scraping**

   - Browser automation with Playwright
   - Automatic retry logic with exponential backoff
   - Progressive loading strategies for dynamic content
   - Intelligent link filtering and duplicate detection

3. **AI-Powered Analysis**

   - Two-phase matching process (initial filtering + deep analysis)
   - Structured output with detailed scoring and reasoning
   - Gemini API integration with rate limit compliance
   - Token usage optimization and tracking

4. **Resource Management**
   - Automatic browser cleanup and memory management
   - Graceful error handling with detailed logging
   - Database transaction management for data consistency
   - Browser instance pooling
   - Database connection handling

## Configuration

```typescript
interface JobMatchingConfig {
	MODEL_NAME: string; // AI model identifier
	BATCH_SIZE: number; // Number of jobs per batch
	MAX_BROWSERS: 3; // Maximum concurrent browser instances
}
```

**Note**: The `MAX_PARALLEL_COMPANIES` constant is now centralized in `/src/constants/common.ts` as part of the `JOB_MATCHING` configuration object for better maintainability.

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

### Architecture Control

```typescript
const orchestrator = new JobMatchingOrchestrator();

// Check current architecture
const info = orchestrator.getArchitectureInfo();
console.log(`Using ${info.version} architecture`); // "pipeline-based" or "legacy"

// Switch to legacy architecture
orchestrator.setPipelineEnabled(false);

// Switch back to pipeline architecture
orchestrator.setPipelineEnabled(true);

// Environment-based control
// Set USE_PIPELINE_ARCHITECTURE=false to default to legacy
```

### Pipeline vs Legacy Behavior

- **Pipeline**: Modern, modular, step-based processing with enhanced error handling
- **Legacy**: Original implementation, preserved for backward compatibility
- **Fallback**: Pipeline failures automatically fall back to legacy implementation
- **Performance**: Pipeline offers better observability and maintainability

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
