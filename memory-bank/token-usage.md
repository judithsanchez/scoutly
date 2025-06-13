# Token Usage Documentation

## Overview

This document details the token usage patterns and implementation in the Scoutly application, which uses the `gemini-2.0-flash-lite` model.

## Rate Limits

- **Requests per Minute (RPM)**: 30
- **Tokens per Minute (TPM)**: 1,000,000
- **Requests per Day (RPD)**: 1,500
- **Tokens per Day (TPD)**: No explicit limit

## Token Usage Points

### 1. Initial Job Matching

Located in `performInitialMatching()`:

- Processes job listings for initial candidate matching
- Uses structured output with `initialMatchingSchema`
- Token consumption includes:
  - System role prompt
  - First selection task template
  - Candidate profile (XML format)
  - CV content
  - Job listings (title, URL, context)

### 2. Deep Dive Analysis

Located in `performDeepDiveAnalysis()`:

- Analyzes matches in batches of 5 jobs
- Uses structured output with `deepDiveSchema`
- Token consumption includes:
  - System role prompt
  - Job post deep dive template
  - Candidate profile
  - CV content
  - Detailed job descriptions

### 3. Job Batch Analysis

Located in `analyzeJobBatch()`:

- Processes job batches with comprehensive schema
- Includes extensive job metadata:
  - Location and timezone
  - Salary information
  - Tech stack requirements
  - Language requirements
  - Visa/relocation details

## Token Tracking Implementation

### Usage Monitoring

```typescript
private usageStats = {
    minuteTokens: 0,
    dayTokens: 0,
    totalTokens: 0,
    calls: 0,
    lastMinuteCalls: 0,
    lastDayCalls: 0,
    lastReset: new Date(),
};
```

### Rate Limit Checking

The system performs automatic rate limit checking before each API call:

1. Checks daily limits
2. Checks minute-based limits
3. Implements automatic throttling with delays when limits are approached

### Token Recording

After each API call, the system:

1. Records prompt, candidate, and total tokens
2. Updates minute and daily counters
3. Resets counters automatically after their time windows
4. Maintains running totals for analysis

## Optimization Strategies

1. **Batch Processing**

   - Jobs are processed in batches of 5
   - Reduces total API calls
   - Optimizes token usage per request

2. **Smart Throttling**

   - Automatic delay when approaching limits
   - Resets counters at appropriate intervals
   - Prevents rate limit errors

3. **Context Optimization**
   - XML formatting for structured data
   - Efficient prompt templates
   - Minimal redundancy in API calls

## System Safeguards

1. **Automatic Cleanup**

   - Clears cached content after use
   - Prevents memory leaks
   - Maintains system efficiency

2. **Error Handling**

   - Retries with exponential backoff
   - Error logging and monitoring
   - Graceful degradation on limits

3. **Usage Tracking**
   - Detailed usage statistics
   - Per-call token counting
   - Usage pattern analysis

## Monitoring and Reporting

The system provides detailed usage statistics through the `getUsageSummary()` method:

- Current minute usage
- Daily totals
- All-time statistics
- Average tokens per call

## Best Practices

1. **Token Conservation**

   - Keep prompts concise and focused
   - Use structured data formats
   - Implement batch processing where possible

2. **Rate Limit Management**

   - Monitor usage patterns
   - Implement pre-emptive throttling
   - Use appropriate batch sizes

3. **Error Prevention**
   - Check limits before API calls
   - Implement retry mechanisms
   - Maintain usage logs
