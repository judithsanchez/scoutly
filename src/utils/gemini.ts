import {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
	SchemaType,
	FunctionDeclaration,
} from '@google/generative-ai';
import {Logger} from './logger';
import type {ExtractedLink} from './scraper';

const logger = new Logger('GeminiAI');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
	throw new Error('GEMINI_API_KEY environment variable is required');
}
const genAI = new GoogleGenerativeAI(apiKey);

const matchPositionsSchema: FunctionDeclaration = {
	name: 'findMatchingPositions',
	description: 'Match job positions against CV content to find suitable roles',
	parameters: {
		type: SchemaType.OBJECT,
		properties: {
			recommendedPositions: {
				type: SchemaType.ARRAY,
				description: 'Only the positions that match the specified criteria',
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
		required: ['recommendedPositions'],
	},
};

logger.debug('Initializing Gemini model with function calling schemas');

const model = genAI.getGenerativeModel({
	model: 'gemini-2.0-flash',
	safetySettings: [
		{
			category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
			threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
		},
	],
	tools: [{functionDeclarations: [matchPositionsSchema]}],
});

logger.info('Gemini model initialized successfully');

export interface MatchedPosition {
	title: string;
	url: string;
}

function getGoogleDriveFileId(url: string): string {
	const match = url.match(/\/d\/([^/]+)/);
	return match ? match[1] : '';
}

function getGoogleDriveDownloadUrl(url: string): string {
	const fileId = getGoogleDriveFileId(url);
	if (!fileId) {
		throw new Error('Invalid Google Drive URL');
	}
	return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

async function processPDF(pdfUrl: string): Promise<string> {
	try {
		logger.info('Processing PDF from URL:', pdfUrl);

		const downloadUrl = pdfUrl.includes('drive.google.com')
			? getGoogleDriveDownloadUrl(pdfUrl)
			: pdfUrl;

		const response = await fetch(downloadUrl);
		const text = await response.text();

		const result = await model.generateContent({
			contents: [
				{
					role: 'user',
					parts: [
						{
							text: `
Extract and structure the key information from this CV text:
${text}

Focus on:
1. Skills and technologies
2. Work experience
3. Education
4. Projects and achievements

Return the information in a clear, organized format.
`,
						},
					],
				},
			],
		});

		logger.success('CV processed successfully');
		return result.response.text();
	} catch (error: any) {
		logger.error('Error processing CV:', error);
		throw new Error(`CV processing failed: ${error.message}`);
	}
}

export async function findMatchingPositions(
	links: ExtractedLink[],
	cvUrl: string,
): Promise<Array<MatchedPosition>> {
	try {
		logger.info('Starting CV-based position analysis');

		logger.info('Processing CV from URL');
		const cvContent = await processPDF(cvUrl);

		logger.debug(`Analyzing ${links.length} links against CV`);

		const prompt = `
You are an expert recruiter who matches candidates to suitable job positions.

First, analyze the following CV content to understand the candidate's profile.
Pay special attention to:
1. Technical skills and programming languages
2. Years of experience in different roles
3. Project experience and achievements
4. Education and certifications
5. Areas of expertise and specialization

CV content:
${cvContent}

Now, for each of these job positions, determine if it would be a good match based on:
1. Required skills matching the candidate's expertise
2. Experience level alignment
3. Role responsibilities matching past experience
4. Technical stack compatibility
5. Growth potential given the candidate's background

Links to analyze:
${links
	.map(
		link => `Title: ${link.text}\nURL: ${link.url}\nContext: ${link.context}\n`,
	)
	.join('\n')}

Return ONLY the positions that are genuinely suitable matches for the candidate's skills and experience level.
Do NOT include positions that would require significantly more experience than the candidate has.
`;

		const result = await model.generateContent({
			contents: [{role: 'user', parts: [{text: prompt}]}],
			generationConfig: {temperature: 0.2},
		});

		const functionCalls = result.response.functionCalls?.();
		const call = functionCalls?.[0];

		if (call?.name === 'findMatchingPositions') {
			const parsed = call.args as {
				recommendedPositions: Array<MatchedPosition>;
			};
			logger.info(
				`✅ Found ${
					parsed.recommendedPositions?.length ?? 0
				} matching positions`,
			);
			return parsed.recommendedPositions || [];
		}

		logger.warn('⚠️ No structured response received from Gemini');
		return [];
	} catch (err) {
		logger.error('❌ Error during job matching:', err);
		return [];
	}
}
