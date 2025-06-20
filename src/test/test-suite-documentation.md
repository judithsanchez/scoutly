# Test Suite Documentation

## Overview

Comprehensive test suite ensuring reliability and correctness of the Scoutly application. As of June 2025, all 69 tests across 13 test files pass consistently in the Docker environment.

## Test Statistics

### Current Status ✅

- **Test Files**: 13 files with comprehensive coverage
- **Total Tests**: 69 individual test cases
- **Pass Rate**: 100% (all tests passing)
- **Environment**: Fully functional in Docker containers
- **Runtime**: ~7 seconds average execution time

### Coverage Areas

#### API Endpoints (5 files)

- `src/app/api/users/__tests__/route.test.ts` - User creation and retrieval
- `src/app/api/jobs/__tests__/route.test.ts` - Job matching orchestration
- `src/app/api/jobs/saved/__tests__/route.test.ts` - Saved job management
- `src/app/api/jobs/saved/status/__tests__/route.test.ts` - Job status updates
- `src/app/api/scrape/__tests__/route.test.ts` - Web scraping functionality

#### Services (3 files)

- `src/services/__tests__/userService.test.ts` - User management operations
- `src/services/__tests__/logService.test.ts` - Logging and persistence
- `src/services/__tests__/tokenUsageService.test.ts` - AI token tracking
- `src/services/__tests__/scrapeHistoryService.test.ts` - Scraping history

#### Utilities (2 files)

- `src/utils/__tests__/logger.test.ts` - Logger functionality and buffering
- `src/utils/__tests__/scraper.test.ts` - Web scraping utilities

#### Hooks (1 file)

- `src/hooks/__tests__/useCompanies.test.ts` - React hooks for company data

#### Components (1 file)

- `src/components/__tests__/ThemeToggle.test.tsx` - UI component testing

#### Miscellaneous (1 file)

- Additional utility and integration tests

## Test Framework & Tools

### Core Testing Stack

- **Test Runner**: Vitest (fast, modern testing framework)
- **Assertions**: Vitest built-in assertions with Jest compatibility
- **Mocking**: Vi mocking system for dependencies and modules
- **Environment**: Node.js with jsdom for component testing
- **TypeScript**: Full TypeScript support with type checking

### Test Utilities

- **Database Mocking**: In-memory database instances for isolation
- **API Mocking**: Mock HTTP responses and external services
- **Component Testing**: React Testing Library integration
- **Async Testing**: Proper async/await handling with timeouts

## Key Test Improvements (June 2025)

### Mock Data Alignment

- **Fixed API Mocks**: Updated to match actual API response format
- **Database Mocks**: Added `toObject()` methods to match Mongoose behavior
- **Type Safety**: All mocks properly typed to prevent runtime errors

### Timeout Handling

- **Increased Timeouts**: Extended timeouts for Docker environment stability
- **Async Operations**: Proper handling of long-running operations
- **Resource Cleanup**: Ensured proper cleanup of test resources

### Test Data Quality

- **Realistic Data**: Test data matches actual application data structures
- **Edge Cases**: Comprehensive testing of error conditions and edge cases
- **Integration Scenarios**: End-to-end workflow testing

## Test Execution

### Local Development

```bash
# Run all tests with watch mode
npm test

# Run tests once (for CI/CD)
npm test run

# Run specific test file
npm test -- src/services/__tests__/userService.test.ts
```

### Docker Environment

```bash
# Run tests in Docker container
docker compose exec app npm test

# Run tests with verbose output
docker compose exec app npm test -- --run --reporter=verbose

# Run specific test suite
docker compose exec app npm test -- --run src/app/api
```

### CI/CD Integration

```bash
# Quick validation (lint + type-check + tests)
npm run validate:docker

# Full validation including build
npm run validate:full:docker
```

## Test Coverage Areas

### API Endpoint Testing

- **Request Validation**: Proper handling of required/optional parameters
- **Error Scenarios**: 400/404/500 error responses tested
- **Data Transformation**: Correct mapping between internal and API formats
- **Authentication**: User lookup and validation (where applicable)

### Service Layer Testing

- **Business Logic**: Core functionality and edge cases
- **Database Operations**: CRUD operations with proper error handling
- **External Integrations**: Mocked third-party service interactions
- **State Management**: Proper state transitions and consistency

### Utility Function Testing

- **Pure Functions**: Input/output validation for utility functions
- **Error Handling**: Graceful degradation and error recovery
- **Performance**: Efficiency of critical operations
- **Browser Integration**: Playwright scraping functionality

### Component Testing

- **Rendering**: Proper component rendering and props handling
- **User Interactions**: Click handlers and state updates
- **Error States**: Component behavior during error conditions
- **Accessibility**: Basic accessibility compliance

## Test Quality Standards

### Code Coverage Goals

- **Statements**: >90% coverage for critical paths
- **Functions**: 100% coverage for public APIs
- **Branches**: >85% coverage including error handling
- **Lines**: >90% coverage with focus on business logic

### Test Quality Metrics

- **Reliability**: Tests pass consistently across environments
- **Speed**: Fast execution for developer productivity
- **Maintainability**: Clear, readable test code
- **Isolation**: Tests don't interfere with each other

## Continuous Improvement

### Recent Enhancements

- **Docker Compatibility**: Full test suite works in containerized environment
- **Mock Accuracy**: Mocks accurately reflect production behavior
- **Error Scenarios**: Comprehensive error condition testing
- **Performance**: Optimized test execution speed

### Future Improvements

- **Integration Tests**: More end-to-end workflow testing
- **Performance Tests**: Load testing for critical operations
- **Visual Regression**: UI component visual testing
- **Contract Testing**: API contract validation between frontend/backend
