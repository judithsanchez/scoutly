import {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
	SchemaType,
	FunctionDeclaration,
} from '@google/generative-ai';
import {Logger} from './logger';

// Create a dedicated logger for Gemini operations
const logger = new Logger('GeminiAI');

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey as string);

// Define function schema for structured output
const schema: FunctionDeclaration = {
	name: 'extractJobData',
	description: 'Extract job data from content',
	parameters: {
		type: SchemaType.OBJECT,
		properties: {
			companyName: {
				type: SchemaType.STRING,
				description: 'The name of the company offering jobs',
			},
			openPositions: {
				type: SchemaType.ARRAY,
				description: 'List of open job positions at the company',
				items: {
					type: SchemaType.OBJECT,
					properties: {
						title: {
							type: SchemaType.STRING,
							description: 'The title of the job position',
						},
						url: {
							type: SchemaType.STRING,
							description: 'The URL to apply for the job',
						},
					},
					required: ['title', 'url'],
				},
			},
		},
		required: ['companyName', 'openPositions'],
	},
};

logger.debug('Initializing Gemini model with function calling schema');

const model = genAI.getGenerativeModel({
	model: 'gemini-2.0-flash',
	safetySettings: [
		{
			category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
			threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
		},
	],
	tools: [{functionDeclarations: [schema]}],
});

logger.info('Gemini model initialized successfully');

// Main function
export async function getStructuredJobData(
	content: string,
	companyName?: string,
): Promise<{
	companyName: string;
	openPositions: {title: string; url: string}[];
}> {
	logger.info(`Processing job data extraction request.`);
	logger.debug(`Content length: ${content.length} characters`);

	const companyNameInfo = companyName
		? `The company name is "${companyName}". Use this exact name in your response.`
		: '';

	const prompt = `
You are a helpful assistant that extracts job data from a company job board.
${companyNameInfo}

Content:
${content}

Extract all job positions from the content. Use the exact company name provided (if any), and include all job titles and URLs.
`;

	try {
		logger.debug('Sending request to Gemini API');
		const startTime = Date.now();

		const result = await model.generateContent({
			contents: [{role: 'user', parts: [{text: prompt}]}],
			generationConfig: {temperature: 0.5},
		});

		const endTime = Date.now();
		logger.debug(`Gemini API response received in ${endTime - startTime}ms`);

		const functionCalls = result.response.functionCalls?.();
		const call = functionCalls?.[0];

		if (call?.name === 'extractJobData') {
			const parsed = call.args as {
				companyName: string;
				openPositions: {title: string; url: string}[];
			};
			logger.info(
				`✅ Extracted ${parsed.openPositions?.length ?? 0} job(s) from Gemini.`,
			);
			return parsed;
		}

		logger.warn('⚠️ No structured function call received from Gemini.');
		throw new Error('No structured response from Gemini.');
	} catch (err) {
		logger.error('❌ Gemini job extraction error:', err);

		const fallback = {
			companyName: companyName || 'Unknown Company',
			openPositions: [],
		};

		logger.info(
			`Returning fallback structure with company name: ${fallback.companyName}`,
		);
		return fallback;
	}
}
