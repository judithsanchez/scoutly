import {Schema, SchemaType} from '@google/generative-ai';

export const initialMatchingSchema: Schema = {
	type: SchemaType.OBJECT,
	properties: {
		recommendedPositions: {
			type: SchemaType.ARRAY,
			description:
				'A list of job positions that are a potential good fit for the candidate based on an initial screening.',
			items: {
				type: SchemaType.OBJECT,
				properties: {
					title: {
						type: SchemaType.STRING,
						description: 'The title of the job position.',
					},
					url: {
						type: SchemaType.STRING,
						description: 'The direct URL to the job posting.',
					},
				},
				required: ['title', 'url'],
			},
		},
	},
	required: ['recommendedPositions'],
};

// Schema for the Deep Dive Batch Analysis
export const deepDiveSchema: Schema = {
	type: SchemaType.OBJECT,
	properties: {
		analysisResults: {
			type: SchemaType.ARRAY,
			description: 'Analysis results for each job position.',
			items: {
				type: SchemaType.OBJECT,
				properties: {
					title: {
						type: SchemaType.STRING,
						description: 'The title of the job position being analyzed.',
					},
					url: {
						type: SchemaType.STRING,
						description: 'The URL of the job position.',
					},
					goodFitReasons: {
						type: SchemaType.ARRAY,
						description:
							'Concise reasons why this job strongly matches the candidate.',
						items: {type: SchemaType.STRING},
					},
					considerationPoints: {
						type: SchemaType.ARRAY,
						description:
							'Brief list of concerns, risks, or key points for consideration.',
						items: {type: SchemaType.STRING},
					},
					stretchGoals: {
						type: SchemaType.ARRAY,
						description: 'Skills to develop in this role.',
						items: {type: SchemaType.STRING},
					},
					suitabilityScore: {
						type: SchemaType.NUMBER,
						description:
							'Overall suitability score (0-100) for this role-candidate match.',
					},
				},
				required: [
					'title',
					'url',
					'goodFitReasons',
					'considerationPoints',
					'stretchGoals',
					'suitabilityScore',
				],
			},
		},
	},
	required: ['analysisResults'],
};
