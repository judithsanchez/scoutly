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
					location: {
						type: SchemaType.STRING,
						description: 'The location of the job position (if specified)',
					},
					timezone: {
						type: SchemaType.STRING,
						description:
							'The timezone or working hours requirement (if specified)',
					},
					salary: {
						type: SchemaType.OBJECT,
						description: 'Salary information if available in the job posting',
						properties: {
							min: {
								type: SchemaType.NUMBER,
								description: 'Minimum salary amount',
							},
							max: {
								type: SchemaType.NUMBER,
								description: 'Maximum salary amount',
							},
							currency: {
								type: SchemaType.STRING,
								description: 'Currency code (e.g., USD, EUR)',
							},
							period: {
								type: SchemaType.STRING,
								description: 'Pay period (yearly, monthly, hourly)',
							},
						},
					},
					techStack: {
						type: SchemaType.ARRAY,
						description:
							'Main technologies and tools required for the position',
						items: {type: SchemaType.STRING},
					},
					experienceLevel: {
						type: SchemaType.STRING,
						description:
							'Required experience level (e.g., Junior, Mid, Senior)',
					},
					languageRequirements: {
						type: SchemaType.ARRAY,
						description:
							'Required languages for the position (e.g., ["English", "Spanish"]). Empty if not specified.',
						items: {type: SchemaType.STRING},
					},
					visaSponsorshipOffered: {
						type: SchemaType.BOOLEAN,
						description: 'Whether visa sponsorship is explicitly offered',
					},
					relocationAssistanceOffered: {
						type: SchemaType.BOOLEAN,
						description: 'Whether relocation assistance is explicitly offered',
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
