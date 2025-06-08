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

// Schema for the Deep Dive Analysis
export const deepDiveSchema: Schema = {
	type: SchemaType.OBJECT,
	properties: {
		goodFitReasons: {
			type: SchemaType.ARRAY,
			description:
				'Concise reasons why this job strongly matches the candidate. Be brief but specific.',
			items: {type: SchemaType.STRING},
		},
		considerationPoints: {
			type: SchemaType.ARRAY,
			description:
				'Brief list of concerns, risks, or key points for candidate consideration. Keep each point concise.',
			items: {type: SchemaType.STRING},
		},
		stretchGoals: {
			type: SchemaType.ARRAY,
			description:
				'Skills the candidate would learn/develop in this role. Frame as growth opportunities, keep brief.',
			items: {type: SchemaType.STRING},
		},
		suitabilityScore: {
			type: SchemaType.NUMBER,
			description:
				'Overall suitability score (0-100) for this role-candidate match.',
		},
	},
	required: [
		'goodFitReasons',
		'considerationPoints',
		'stretchGoals',
		'suitabilityScore',
	],
};
