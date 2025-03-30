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

/**
 * Job position structure
 */
interface JobPosition {
	title: string;
	url: string;
}

interface CompanyJobData {
	companyName: string;
	openPositions: JobPosition[];
}

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

export async function getStructuredJobData(
	content: string,
	userContext: string,
	companyName?: string,
): Promise<CompanyJobData> {
	logger.info(
		`Processing job data extraction request with context: ${userContext}`,
	);
	logger.debug(`Content length: ${content.length} characters`);

	// Include company name in the prompt if provided
	const companyNameInfo = companyName
		? `The company name is "${companyName}". Use this exact name in your response.`
		: '';

	const prompt = `
You are a helpful assistant that extracts job data from text.

Context: ${userContext}
${companyNameInfo}

Content:
${content}

Extract all job positions from the content. If no job positions are found, return an empty array.
Make sure to use the exact company name provided and include all job positions with their titles and URLs.
`;

	try {
		logger.debug('Sending request to Gemini API');
		const startTime = Date.now();

		const result = await model.generateContent({
			contents: [{role: 'user', parts: [{text: prompt}]}],
			generationConfig: {temperature: 0.2},
		});

		const endTime = Date.now();
		logger.debug(`Gemini API response received in ${endTime - startTime}ms`);

		// Check for function calls
		const functionCalls = result.response.functionCalls();
		const call = functionCalls && functionCalls[0];

		if (call && call.name === 'extractJobData') {
			logger.info('Function call detected in Gemini response');
			logger.debug(`Function name: ${call.name}`);

			try {
				// Fix: Get the actual args object instead of converting to string
				const args = call.args as CompanyJobData;
				logger.debug(`Function arguments: ${JSON.stringify(args)}`);

				// No need to parse, args is already an object
				const parsedData = args;
				logger.success(
					`Successfully extracted job data with ${
						parsedData.openPositions?.length || 0
					} positions`,
				);
				return parsedData;
			} catch (parseError) {
				logger.error('Failed to parse function call arguments', parseError);
				throw new Error('Invalid function call response format');
			}
		} else {
			logger.warn(
				'No function call detected in Gemini response, falling back to text parsing',
			);
		}

		// Fallback if no functionCall
		try {
			const fallbackText = result.response.text();
			logger.debug(
				`Fallback text response: ${fallbackText.substring(0, 100)}...`,
			);

			const parsedData = JSON.parse(fallbackText) as CompanyJobData;
			logger.success(
				`Successfully parsed fallback text as JSON with ${
					parsedData.openPositions?.length || 0
				} positions`,
			);
			return parsedData;
		} catch (parseError) {
			logger.warn(
				'Failed to parse Gemini text response as JSON, returning default structure',
				parseError,
			);

			// Create default structure
			const defaultData = {
				companyName:
					companyName || userContext.split(' ')[0] || 'Unknown Company',
				openPositions: [],
			};

			logger.info(
				`Returning default structure with company name: ${defaultData.companyName}`,
			);
			return defaultData;
		}
	} catch (err) {
		logger.error('Gemini job extraction error', err);

		// Create default structure for error case
		const errorFallbackData = {
			companyName:
				companyName || userContext.split(' ')[0] || 'Unknown Company',
			openPositions: [],
		};

		logger.info(
			`Returning error fallback structure with company name: ${errorFallbackData.companyName}`,
		);
		return errorFallbackData;
	}
}
