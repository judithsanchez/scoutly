# Token Usage Service

## Overview

The TokenUsageService manages and tracks AI token usage across the application. It provides detailed analytics, cost tracking, and usage patterns for different operations, users, and companies.

## Architecture

See [tokenUsageService.mmd](./tokenUsageService.mmd) for the complete flow diagram.

## Core Features

1. **Usage Tracking**

   - Token consumption monitoring
   - Cost estimation and tracking
   - Operation-specific metrics
   - Accuracy analysis

2. **Analytics**

   - Usage trends analysis
   - Performance metrics
   - Cost breakdowns
   - Time-based aggregations

3. **Reporting**
   - User-level statistics
   - Company-wide metrics
   - Operation-specific analysis
   - Custom timeframe reports

## Data Models

### Token Usage Input

```typescript
interface TokenUsageInput {
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
	userEmail: string;
	companyId: string;
	companyName: string;
}
```

### Token Usage Stats

```typescript
interface TokenUsageStats {
	totalTokens: number;
	totalCost: number;
	averageTokensPerCall: number;
	totalCalls: number;
	estimationAccuracy: number;
}
```

### Timeframe Filter

```typescript
interface TimeframeFilter {
	start?: Date;
	end?: Date;
}
```

## Core Methods

### Record Usage

```typescript
static async recordUsage(
  usage: TokenUsageInput
): Promise<ITokenUsage>
```

Records token usage for a single operation.

#### Parameters

- `usage`: Token usage details including costs and metadata

#### Returns

- Saved token usage record

### Get Usage Stats

#### User Stats

```typescript
static async getUserStats(
  userEmail: string,
  timeframe?: TimeframeFilter
): Promise<TokenUsageStats>
```

#### Company Stats

```typescript
static async getCompanyStats(
  companyId: string,
  timeframe?: TimeframeFilter
): Promise<TokenUsageStats>
```

#### Operation Stats

```typescript
static async getOperationStats(
  operation: TokenOperation,
  timeframe?: TimeframeFilter
): Promise<TokenUsageStats>
```

### Analysis Methods

#### Usage Trends

```typescript
static async getUsageTrends(
  timeframe: TimeframeFilter,
  granularity: 'day' | 'week' | 'month' = 'day'
)
```

#### Performance Metrics

```typescript
static async getModelPerformanceMetrics(
  timeframe?: TimeframeFilter
)
```

#### Cost Breakdown

```typescript
static async getCostBreakdownByPeriod(
  timeframe: TimeframeFilter,
  granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
)
```

## Usage Examples

### Basic Usage Recording

```typescript
const usage = await TokenUsageService.recordUsage({
	processId: crypto.randomUUID(),
	operation: TokenOperation.INITIAL_MATCHING,
	estimatedTokens: 1000,
	actualTokens: 950,
	inputTokens: 500,
	outputTokens: 450,
	costEstimate: {
		input: 0.001,
		output: 0.002,
		total: 0.003,
		currency: 'USD',
		isFreeUsage: true,
	},
	userEmail: 'user@example.com',
	companyId: 'company123',
	companyName: 'Example Corp',
});
```

### Getting Usage Statistics

```typescript
// User stats for last 30 days
const userStats = await TokenUsageService.getUserStats('user@example.com', {
	start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	end: new Date(),
});

// Company stats
const companyStats = await TokenUsageService.getCompanyStats('company123');

// Operation stats
const matchingStats = await TokenUsageService.getOperationStats(
	TokenOperation.INITIAL_MATCHING,
);
```

### Analyzing Trends

```typescript
// Get weekly usage trends
const trends = await TokenUsageService.getUsageTrends(
	{
		start: new Date('2025-01-01'),
		end: new Date('2025-12-31'),
	},
	'week',
);

// Get hourly cost breakdown
const costs = await TokenUsageService.getCostBreakdownByPeriod(
	{
		start: new Date(Date.now() - 24 * 60 * 60 * 1000),
	},
	'hour',
);
```

## Error Handling

### TokenUsageError

```typescript
class TokenUsageError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = 'TokenUsageError';
	}
}
```

### Error Categories

1. **Database Errors**

   - Connection issues
   - Query failures
   - Aggregation errors

2. **Validation Errors**

   - Invalid timeframes
   - Missing required fields
   - Invalid operation types

3. **Processing Errors**
   - Aggregation failures
   - Calculation errors
   - Data conversion issues

## Performance Optimization

### Query Optimization

1. **Aggregation Pipelines**

   - Efficient grouping
   - Proper indexing
   - Staged processing

2. **Data Storage**
   - Time-based partitioning
   - Regular cleanup
   - Index optimization

### Caching Strategies

1. **Results Caching**

   - Common queries
   - Aggregate results
   - Time-windowed data

2. **Memory Management**
   - Efficient data structures
   - Resource cleanup
   - Batch processing

## Monitoring

### Key Metrics

1. **Usage Metrics**

   - Token consumption rates
   - Cost accumulation
   - Operation frequencies

2. **Performance Metrics**
   - Query response times
   - Aggregation durations
   - Error rates

### Logging

```typescript
const logger = new Logger('TokenUsageService');

logger.debug('Token usage recorded', {
	operation: usage.operation,
	tokens: {
		estimated: usage.estimatedTokens,
		actual: usage.actualTokens,
		accuracy: `${accuracy}%`,
	},
	cost: usage.costEstimate,
});
```

## Best Practices

### 1. Recording Usage

- Always include process ID
- Record both estimated and actual tokens
- Include detailed cost breakdowns
- Handle errors gracefully

### 2. Querying Data

- Use appropriate time windows
- Implement pagination for large results
- Cache frequently accessed data
- Handle missing data cases

### 3. Cost Management

- Monitor usage patterns
- Set up alerts for thresholds
- Track estimation accuracy
- Regular cost analysis

## Future Improvements

1. **Analytics**

   - Real-time monitoring
   - Predictive analysis
   - Usage forecasting
   - Cost optimization suggestions

2. **Performance**

   - Query optimization
   - Caching layer
   - Batch processing
   - Data archival

3. **Features**
   - Custom reporting
   - Alert system
   - Budget management
   - Usage quotas

## Security Considerations

1. **Data Access**

   - Role-based access control
   - Data encryption
   - Audit logging

2. **Cost Protection**

   - Usage limits
   - Cost thresholds
   - Automatic alerts

3. **Compliance**
   - Data retention policies
   - Usage tracking
   - Cost allocation
