// src/utils/geminiSchemas.ts

import {Schema, SchemaType} from '@google/generative-ai';

// Schema for the First Pass (Initial Matching)
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
				'A list of reasons why this job is a strong match for the candidate.',
			items: {type: SchemaType.STRING},
		},
		considerationPoints: {
			type: SchemaType.ARRAY,
			description:
				'A list of potential concerns, risks, or points for the candidate to consider.',
			items: {type: SchemaType.STRING},
		},
		stretchGoals: {
			type: SchemaType.ARRAY,
			description:
				'A list of skills the candidate would learn or be stretched by in this role, framed as growth opportunities.',
			items: {type: SchemaType.STRING},
		},
		suitabilityScore: {
			type: SchemaType.NUMBER,
			description:
				'A numerical score from 0 to 100 indicating the overall suitability of the role for the candidate.',
		},
	},
	required: [
		'goodFitReasons',
		'considerationPoints',
		'stretchGoals',
		'suitabilityScore',
	],
};
