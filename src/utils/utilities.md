# Utility Functions Documentation

## Overview

This document describes the utility functions extracted from the JobMatchingOrchestrator to improve code maintainability, reusability, and testability.

## Data Transformation Utilities (`src/utils/dataTransform.ts`)

### Purpose

Handles data format conversions commonly used throughout the application.

### Functions

#### `objectToXML(obj: any): string`

- Converts JavaScript objects to XML format for AI processing
- Handles nested objects, arrays, and primitive values
- Sanitizes key names for valid XML tags

#### `createUrlSet(urls: Array<{url: string} | string>): Set<string>`

- Creates efficient URL lookup sets from arrays
- Handles both string URLs and objects with url properties

#### `filterLinksByUrlSet<T>(links: T[], urlSet: Set<string>): T[]`

- Filters link arrays using URL sets for O(1) lookups
- Generic function for type safety

### Usage Example

```typescript
const candidateXML = objectToXML(candidateInfo);
const urlSet = createUrlSet(newUrls);
const filteredLinks = filterLinksByUrlSet(allLinks, urlSet);
```

## Rate Limiting Utilities (`src/utils/rateLimiting.ts`)

### Purpose

Manages API rate limits and usage tracking for external services.

### Functions

#### `createUsageStats(): UsageStats`

- Creates fresh usage statistics object
- Initializes all counters to zero

#### `checkDailyReset(usageStats: UsageStats): UsageStats`

- Checks if 24 hours have passed and resets daily counters
- Updates last reset timestamp

#### `checkRateLimits(modelLimits: IGeminiRateLimit, usageStats: UsageStats): Promise<void>`

- Enforces rate limits with automatic waiting
- Handles daily, per-minute request, and token limits
- Provides detailed logging for limit violations

#### `getUsageSummary(modelLimits: IGeminiRateLimit, usageStats: UsageStats): string`

- Generates formatted usage statistics
- Shows current usage against limits
- Calculates averages

### Usage Example

```typescript
const usageStats = createUsageStats();
await checkRateLimits(modelLimits, usageStats);
const summary = getUsageSummary(modelLimits, usageStats);
```

## Batch Processing Utilities (`src/utils/batchProcessing.ts`)

### Purpose

Provides efficient batch processing capabilities for large datasets.

### Functions

#### `createBatches<T>(items: T[], batchSize: number): T[][]`

- Splits arrays into manageable batch sizes
- Generic function for any data type

#### `processInParallelBatches<T, R>(items: T[], processor: Function, maxConcurrency: number): Promise<(R | null)[]>`

- Processes items in parallel with concurrency limits
- Handles errors gracefully without stopping processing
- Maintains original order in results

#### `processSequentialBatches<T, R>(batches: T[][], processor: Function, batchName: string): Promise<R[]>`

- Processes batches sequentially with detailed logging
- Provides progress updates
- Aggregates results from all batches

#### `addRandomDelay(baseDelay: number, randomRange: number): Promise<void>`

- Adds randomized delays to avoid overwhelming services
- Configurable base delay and random range

### Usage Example

```typescript
const batches = createBatches(jobs, 5);
const results = await processSequentialBatches(
	batches,
	analyzeJobBatch,
	'jobs',
);
```

## Template Loading Utilities (`src/utils/templateLoader.ts`)

### Purpose

Centralizes loading and validation of AI prompt templates.

### Functions

#### `loadTemplate(templatePath: string): Promise<string>`

- Loads single template file with error handling
- Provides detailed logging
- Resolves paths relative to project root

#### `loadPromptTemplates(): Promise<PromptTemplates>`

- Loads all required templates in parallel
- Returns structured template object
- Comprehensive error handling

#### `validateTemplates(templates: PromptTemplates): void`

- Validates all templates are loaded and non-empty
- Throws descriptive errors for missing templates

### Usage Example

```typescript
const templates = await loadPromptTemplates();
validateTemplates(templates);
// Use templates.systemRole, templates.firstSelectionTask, etc.
```

## Benefits of Extraction

### 1. **Improved Maintainability**

- Single responsibility principle
- Easier to modify and extend
- Clear separation of concerns

### 2. **Better Testability**

- Utilities can be tested independently
- Simpler unit tests
- Easier mocking and stubbing

### 3. **Code Reusability**

- Functions can be used across different services
- Consistent behavior application-wide
- Reduced code duplication

### 4. **Enhanced Debugging**

- Isolated functionality easier to debug
- Specialized logging per utility
- Clear error boundaries

### 5. **Type Safety**

- Generic functions provide compile-time safety
- Clear input/output types
- Better IDE support

## Integration Guidelines

When integrating these utilities into the orchestrator:

1. **Import at the top of the file**
2. **Replace inline logic with utility calls**
3. **Update error handling to use utility errors**
4. **Update tests to cover utility functions**
5. **Update documentation to reference utilities**

## Future Enhancements

These utilities can be extended with:

- Caching mechanisms
- Configuration-driven behavior
- Performance monitoring
- Additional data transformation formats
- Advanced batch processing strategies
