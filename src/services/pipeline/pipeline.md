# Job Matching Pipeline

## Overview

The Job Matching Pipeline is a modular, step-based architecture that breaks down the complex job matching process into discrete, manageable steps. Each step operates on a shared context and can be tested, modified, or replaced independently.

## Architecture

### Core Components

1. **PipelineContext**: Shared state passed between all steps
2. **PipelineStep**: Interface for individual processing steps
3. **JobMatchingPipeline**: Engine that executes steps in sequence
4. **JobMatchingContext**: Concrete implementation of shared context

### Pipeline Flow

```
Input → Step 1 → Step 2 → Step 3 → ... → Step N → Output
         ↓        ↓        ↓              ↓
    Update Context → Context → Context → Final Context
```

## Features

### Error Handling

- **Per-step error handling**: Each step can define custom error recovery
- **Graceful degradation**: Option to continue execution even if steps fail
- **Comprehensive logging**: Detailed execution tracking and error reporting

### Performance

- **Skip logic**: Steps can be skipped based on context conditions
- **Timeout protection**: Configurable pipeline execution timeout
- **Resource cleanup**: Automatic cleanup of resources and memory

### Observability

- **Step timing**: Track execution time for each step
- **Execution summary**: Comprehensive results with success/failure counts
- **Debug logging**: Detailed logging for troubleshooting

## Usage

### Basic Pipeline Setup

```typescript
import {JobMatchingPipeline} from './JobMatchingPipeline';
import {JobMatchingContext} from './JobMatchingContext';

// Create pipeline
const pipeline = new JobMatchingPipeline({
	continueOnError: false,
	allowSkipping: true,
	timeoutMs: 300000,
});

// Add steps
pipeline
	.addStep(new CvProcessingStep())
	.addStep(new CompanyScrapingStep())
	.addStep(new InitialMatchingStep())
	.addStep(new DeepAnalysisStep())
	.addStep(new ResultsStorageStep());

// Create context
const context = new JobMatchingContext(
	companies,
	cvUrl,
	candidateInfo,
	userEmail,
	usageStats,
	aiConfig,
	modelLimits,
);

// Execute pipeline
const result = await pipeline.execute(context);
console.log(result.summary);
```

### Custom Step Implementation

```typescript
import {PipelineStep, PipelineContext} from './types';

export class CustomStep implements PipelineStep {
	readonly name = 'CustomStep';
	readonly description = 'Performs custom processing';

	async execute(context: PipelineContext): Promise<PipelineContext> {
		// Implement step logic
		// Update context as needed
		return context;
	}

	canSkip(context: PipelineContext): boolean {
		// Return true if step should be skipped
		return false;
	}

	validate(context: PipelineContext): void {
		// Validate context before execution
		if (!context.someRequiredField) {
			throw new Error('Required field missing');
		}
	}

	async onError(error: Error, context: PipelineContext): Promise<void> {
		// Handle errors that occur during execution
		console.error(`Step failed: ${error.message}`);
	}
}
```

## Integration with Existing Orchestrator

The pipeline is designed to be used internally by the existing `JobMatchingOrchestrator` while maintaining backward compatibility:

```typescript
export class JobMatchingOrchestrator {
	private pipeline: JobMatchingPipeline;

	constructor() {
		// Initialize pipeline with steps
		this.pipeline = new JobMatchingPipeline()
			.addStep(new CvProcessingStep())
			.addStep(new CompanyScrapingStep());
		// ... other steps
	}

	async orchestrateBatchJobMatching(
		companies: ICompany[],
		cvUrl: string,
		candidateInfo: Record<string, any>,
		userEmail: string,
	): Promise<Map<string, JobAnalysisResult[]>> {
		// Create context
		const context = new JobMatchingContext(/* ... */);

		// Execute pipeline
		const result = await this.pipeline.execute(context);

		// Return results in expected format
		return result.context.analysisResults || new Map();
	}
}
```

## Benefits

1. **Modularity**: Each step is self-contained and focused on a single responsibility
2. **Testability**: Steps can be unit tested in isolation
3. **Maintainability**: Easy to modify, add, or remove steps
4. **Observability**: Clear visibility into pipeline execution and performance
5. **Error Resilience**: Robust error handling and recovery mechanisms
6. **Extensibility**: Simple to add new steps or customize existing ones

## File Structure

```
src/services/pipeline/
├── types.ts                    # Core interfaces and types
├── JobMatchingPipeline.ts      # Pipeline execution engine
├── JobMatchingContext.ts       # Shared context implementation
├── pipeline.md                 # This documentation
└── steps/
    ├── CvProcessingStep.ts
    ├── CompanyScrapingStep.ts
    ├── InitialMatchingStep.ts
    ├── DeepAnalysisStep.ts
    └── ResultsStorageStep.ts
```

## Migration Strategy

The pipeline architecture is being introduced gradually:

1. ✅ **Phase 1**: Create pipeline infrastructure (types, context, engine)
2. 🔄 **Phase 2**: Extract existing logic into pipeline steps
3. ⏳ **Phase 3**: Update orchestrator to use pipeline internally
4. ⏳ **Phase 4**: Optional - Expose pipeline customization API

This ensures no breaking changes to the existing API while providing a more maintainable internal architecture.
