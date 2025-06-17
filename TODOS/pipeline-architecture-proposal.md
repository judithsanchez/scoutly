# Job Matching Pipeline Architecture Proposal

## Overview

Transform the JobMatchingOrchestrator into a pipeline-based architecture with individual steps and shared context, while maintaining backward compatibility.

## Current Architecture Issues

1. **Monolithic Methods**: Large methods handling multiple concerns
2. **State Management**: Instance variables scattered across the class
3. **Error Handling**: Inconsistent error handling across different operations
4. **Testing**: Difficult to test individual steps in isolation
5. **Extensibility**: Hard to add new steps or modify existing ones

## Proposed Pipeline Architecture

### Core Components

```typescript
interface PipelineContext {
	// Input data
	companies: ICompany[];
	cvUrl: string;
	candidateInfo: Record<string, any>;
	userEmail: string;

	// Processing state
	cvContent?: string;
	candidateProfile?: Record<string, any>;
	scrapedData?: Map<string, ExtractedLink[]>;
	matchedJobs?: Array<{title: string; url: string}>;
	jobDetails?: Map<string, string>;
	analysisResults?: Map<string, JobAnalysisResult[]>;

	// Configuration
	usageStats: UsageStats;
	aiConfig: AIProcessorConfig;
	modelLimits: IGeminiRateLimit;

	// Context methods
	setCompanyContext(companyId: string, companyName: string): void;
	recordUsage(usage: TokenUsage, operation?: TokenOperation): Promise<void>;
	cleanup(): Promise<void>;
}

interface PipelineStep {
	name: string;
	execute(context: PipelineContext): Promise<PipelineContext>;
	canSkip?(context: PipelineContext): boolean;
	onError?(error: Error, context: PipelineContext): Promise<void>;
}

class JobMatchingPipeline {
	private steps: PipelineStep[] = [];

	addStep(step: PipelineStep): this;
	execute(context: PipelineContext): Promise<PipelineContext>;
}
```

### Individual Pipeline Steps

1. **CompanyScrapingStep** (`/src/services/pipeline/steps/CompanyScrapingStep.ts`)

   - Scrapes job listings from company career pages
   - Filters new links using scrape history
   - Updates context with scraped data

2. **CvProcessingStep** (`/src/services/pipeline/steps/CvProcessingStep.ts`)

   - Downloads CV from URL
   - Extracts text content
   - Updates context with CV content

3. **CandidateProfileStep** (`/src/services/pipeline/steps/CandidateProfileStep.ts`)

   - Processes candidate information
   - Validates required fields
   - Updates context with profile data

4. **InitialMatchingStep** (`/src/services/pipeline/steps/InitialMatchingStep.ts`)

   - Performs AI-powered initial job filtering
   - Handles rate limiting and token usage
   - Updates context with matched jobs

5. **JobDetailsStep** (`/src/services/pipeline/steps/JobDetailsStep.ts`)

   - Scrapes detailed content for matched jobs
   - Batch processing for efficiency
   - Updates context with job details

6. **DeepAnalysisStep** (`/src/services/pipeline/steps/DeepAnalysisStep.ts`)

   - Detailed AI analysis and scoring
   - Batch processing with rate limiting
   - Updates context with analysis results

7. **ResultsStorageStep** (`/src/services/pipeline/steps/ResultsStorageStep.ts`)
   - Saves results to database
   - Handles duplicates
   - Updates user profiles

### Pipeline Context Implementation

```typescript
class JobMatchingContext implements PipelineContext {
	// ... all properties and methods

	// Centralized usage recording
	async recordUsage(
		usage: TokenUsage,
		operation?: TokenOperation,
	): Promise<void> {
		// Implementation using existing TokenUsageService
	}

	// Centralized cleanup
	async cleanup(): Promise<void> {
		// Clean up resources, log final stats
	}
}
```

## Migration Strategy

### Phase 1: Create Pipeline Infrastructure ✅ COMPLETED

- ✅ Create base interfaces and classes
- ✅ Implement PipelineContext
- ✅ Create JobMatchingPipeline class
- ✅ Add comprehensive logging and error handling
- ✅ Create simple integration test

### Phase 2: Extract Steps One by One ✅ COMPLETED

- ✅ Start with simplest steps (CandidateProfileStep - COMPLETED)
- ✅ CV processing step (CvProcessingStep - COMPLETED)
- ✅ Company scraping step (CompanyScrapingStep - COMPLETED)
- ✅ Extract more complex steps (Initial Matching, Deep Analysis - COMPLETED)
- ✅ Maintain orchestrator as fallback during migration
- ✅ Test each step thoroughly

### Phase 3: Update Orchestrator ✅ COMPLETED

- ✅ Make orchestrator use pipeline internally
- ✅ Keep existing public API unchanged
- ✅ Add new pipeline-based methods (setPipelineEnabled, getArchitectureInfo)
- ✅ Comprehensive integration testing
- ✅ Fallback system for pipeline failures
- ✅ Environment-based and runtime control

### Phase 4: Documentation & Visualization ✅ COMPLETED

- ✅ Update orchestrator documentation with pipeline information
- ✅ Create new Mermaid diagram showing dual architecture
- ✅ Document migration process and benefits
- ✅ Add usage examples for both architectures

## Implementation Summary

The pipeline architecture migration has been **successfully completed** with the following achievements:

### ✅ Core Pipeline Infrastructure

- **7 Modular Steps**: Each processing stage is now a separate, testable component
- **Shared Context**: Centralized state management across all pipeline steps
- **Pipeline Engine**: Robust execution engine with comprehensive error handling
- **Configuration System**: Factory methods for easy pipeline setup and execution

### ✅ Orchestrator Integration

- **Dual Architecture**: Supports both pipeline and legacy implementations
- **Backward Compatibility**: Existing public API completely unchanged
- **Smart Fallback**: Automatic fallback to legacy implementation on pipeline failures
- **Runtime Control**: Dynamic switching between architectures via API or environment

### ✅ Enhanced Features

- **Better Error Handling**: Step-level error recovery and comprehensive logging
- **Improved Observability**: Detailed monitoring and status reporting per step
- **Enhanced Maintainability**: Each step is isolated, focused, and unit-testable
- **Extensibility**: Easy addition of new steps or modification of existing ones

### ✅ Quality Assurance

- **Integration Tests**: Comprehensive testing of pipeline integration
- **Documentation**: Updated docs with dual architecture information
- **Visual Diagrams**: New Mermaid diagram showing pipeline vs legacy flows
- **Type Safety**: Full TypeScript support with proper interfaces

## Benefits Realized

1. **Maintainability**: 📈 Code is now highly modular and follows separation of concerns
2. **Testability**: 🧪 Each step can be unit tested in complete isolation
3. **Extensibility**: 🔧 New steps can be easily added without touching existing code
4. **Observability**: 👁️ Clear visibility into pipeline execution with detailed logging
5. **Reliability**: 🛡️ Automatic fallback ensures system stability
6. **Performance**: ⚡ Better resource management and cleanup per step

### Phase 4: Optional - Expose Pipeline API

- Allow users to customize pipeline steps
- Add step configuration options
- Enable step skipping/replacement

## Benefits

1. **Maintainability**: Each step is self-contained and focused
2. **Testability**: Steps can be unit tested in isolation
3. **Extensibility**: Easy to add new steps or modify existing ones
4. **Observability**: Clear visibility into which step is executing
5. **Error Handling**: Consistent error handling per step
6. **Reusability**: Steps can be reused in different pipelines
7. **Performance**: Better resource management and cleanup

## Backward Compatibility

- Existing `orchestrateJobMatching()` and `orchestrateBatchJobMatching()` methods remain unchanged
- Internal implementation uses pipeline
- No breaking changes to public API
- Gradual migration path

## File Structure

```
src/services/
├── jobMatchingOrchestrator.ts          # Main orchestrator (uses pipeline)
├── jobMatchingOrchestrator.md
├── pipeline/
│   ├── JobMatchingPipeline.ts          # Pipeline engine
│   ├── JobMatchingContext.ts           # Shared context
│   ├── types.ts                        # Pipeline interfaces
│   ├── pipeline.md                     # Pipeline documentation
│   └── steps/
│       ├── CompanyScrapingStep.ts
│       ├── CvProcessingStep.ts
│       ├── CandidateProfileStep.ts
│       ├── InitialMatchingStep.ts
│       ├── JobDetailsStep.ts
│       ├── DeepAnalysisStep.ts
│       ├── ResultsStorageStep.ts
│       └── __tests__/                  # Step unit tests
```

## Questions for Consideration

1. Should we implement this incrementally or all at once?
2. Do you want to expose the pipeline API publicly or keep it internal?
3. Should steps be configurable (e.g., enable/disable specific steps)?
4. Any specific error handling or retry strategies per step?
5. Should we add step timing/performance metrics?

This architecture would make the code much more organized, testable, and maintainable while preserving all existing functionality.
