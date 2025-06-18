# Enhanced Logging System

This document describes the comprehensive logging system implemented to improve debugging and error tracking across the Scoutly application.

## Overview

The logging system consists of two main components:

1. **Frontend Logger** (`/src/utils/frontendLogger.ts`) - Provides structured logging for client-side operations
2. **Backend Logger** (`/src/utils/logger.ts`) - Handles server-side logging with database persistence
3. **Log Collection API** (`/src/app/api/logs/route.ts`) - Receives frontend logs and forwards them to backend logger

## Frontend Logging Features

### Core Functionality

- **Structured Logging**: All logs include timestamp, context, message, and optional data
- **Console Formatting**: Color-coded output with emojis for easy visual identification
- **Backend Integration**: Important logs are automatically sent to backend for persistence
- **User Context**: Logs include user ID, session ID, and browser information

### Log Levels

- `debug` - Development debugging information
- `info` - General information about application flow
- `warn` - Warning conditions that don't prevent operation
- `error` - Error conditions that may affect functionality
- `trace` - Detailed tracing for complex workflows

### Specialized Logging Methods

#### API Call Logging

```typescript
logger.logApiRequest(url, method, body?)
logger.logApiResponse(url, status, response?)
logger.logApiError(url, error)
```

#### User Action Logging

```typescript
logger.logUserAction(action, details?)
```

#### Component Lifecycle

```typescript
logger.logComponentMount(componentName, props?)
logger.logComponentUnmount(componentName)
```

#### Form Validation

```typescript
logger.logValidationError(field, error, value?)
```

#### Authentication Events

```typescript
logger.logAuthEvent(event, details?)
```

## Implementation Examples

### Dashboard Page Logging

The dashboard page (`/src/app/dashboard/page.tsx`) now includes comprehensive logging for:

1. **Component Lifecycle**
   - Mount/unmount events with user context
2. **Data Fetching**
   - API requests to fetch saved jobs
   - Response handling and error states
   - Data processing and sorting
3. **User Actions**
   - Job search initiation
   - Status changes for saved jobs
   - Profile validation
4. **Error Handling**
   - Detailed error context
   - Stack traces for debugging
   - User-friendly error messages

### Backend API Logging

Enhanced logging in backend APIs (`/src/app/api/users/profile/route.ts`):

1. **Request Processing**
   - Authentication validation
   - Database connection status
   - User lookup operations
2. **Profile Data**
   - Profile completeness validation
   - Missing field identification
   - Data structure analysis
3. **Error Context**
   - Detailed error information
   - Environment context
   - Database state

## Usage Patterns

### Creating Context-Specific Loggers

```typescript
import {createLogger} from '@/utils/frontendLogger';

const logger = createLogger('ComponentName', userId);
```

### API Request/Response Tracking

```typescript
// Before API call
logger.logApiRequest('/api/endpoint', 'POST', requestData);

// After successful response
logger.logApiResponse('/api/endpoint', response.status, responseData);

// On error
logger.logApiError('/api/endpoint', error);
```

### User Action Tracking

```typescript
logger.logUserAction('Started job search', {
	selectedCompanies: companyIds,
	userEmail: userEmail,
});
```

## Debugging Benefits

### Frontend Issues

1. **Profile Validation**: Clear logging of missing fields and validation failures
2. **API Communication**: Complete request/response cycle tracking
3. **User Flow**: Step-by-step tracking of user actions and system responses
4. **Error Context**: Detailed error information with stack traces

### Backend Issues

1. **Database Operations**: Connection status and query results
2. **Authentication**: Session validation and user lookup
3. **Data Processing**: Profile completeness and field validation
4. **Error Tracking**: Comprehensive error context and environment information

## Log Filtering and Analysis

### Development Environment

- All log levels are displayed in console
- Debug and trace logs are sent to backend
- Detailed stack traces and data dumps

### Production Environment

- Only info, warn, and error logs sent to backend
- Reduced console output
- Focus on critical issues and user actions

## Monitoring and Alerting

The enhanced logging system provides the foundation for:

1. **Real-time Error Monitoring**: Track API failures and user issues
2. **Performance Analysis**: Monitor request/response times and user flows
3. **User Behavior Tracking**: Understand how users interact with the system
4. **Debugging Support**: Comprehensive context for issue resolution

## Next Steps

1. **Log Aggregation**: Implement log aggregation service for production monitoring
2. **Alerting**: Set up alerts for critical errors and performance issues
3. **Analytics**: Use log data for user behavior analysis and system optimization
4. **Retention**: Implement log retention policies and archival strategies
