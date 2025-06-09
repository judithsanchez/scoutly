/**
 * Represents the rate limit structure for a single Gemini model.
 */
export interface IGeminiRateLimit {
	/**
	 * The name of the Gemini model.
	 */
	modelName: string;
	/**
	 * Requests per Minute (RPM). Null if not applicable.
	 */
	rpm: number | null;
	/**
	 * Requests per Day (RPD). Null if not applicable.
	 */
	rpd: number | null;
	/**
	 * Tokens per Minute (TPM). Null if not applicable.
	 */
	tpm: number | null;
	/**
	 * Tokens per Day (TPD). This is an optional, less common limit.
	 */
	tpd?: number | null;
	/**
	 * Concurrent sessions allowed, primarily for the Live API.
	 */
	concurrentSessions?: number | null;
}

/**
 * A static class to hold and access the rate limits for the Gemini API's free tier.
 * Data is based on the provided documentation. Limits can change, so always
 * refer to the official Google AI documentation for the most current information.
 */
export class GeminiFreeTierLimits {
	/**
	 * Rate limits for standard Gemini models in the free tier.
	 */
	public static readonly standardModels: IGeminiRateLimit[] = [
		{
			modelName: 'Gemini 2.5 Flash Preview 05-20',
			rpm: 10,
			rpd: 500,
			tpm: 250000,
		},
		{
			modelName: 'Gemini 2.5 Flash Preview TTS',
			rpm: 3,
			rpd: 15,
			tpm: 10000,
		},
		{
			modelName: 'Gemini 2.5 Pro Preview 06-05',
			rpm: null,
			rpd: null,
			tpm: null,
		},
		{
			modelName: 'Gemini 2.5 Pro Preview TTS',
			rpm: null,
			rpd: null,
			tpm: null,
		},
		{
			modelName: 'Gemini 2.5 Pro Experimental 03-25',
			rpm: 5,
			rpd: 25,
			tpm: 250000,
			tpd: 1000000, // Special case with a Tokens per Day limit
		},
		{
			modelName: 'Gemini 2.0 Flash',
			rpm: 15,
			rpd: 1500,
			tpm: 1000000,
		},
		{
			modelName: 'Gemini 2.0 Flash Preview Image Generation',
			rpm: 10,
			rpd: 100,
			tpm: 200000, // Note: This is conceptually IPM (Images per Minute)
		},
		{
			modelName: 'Gemini 2.0 Flash Experimental',
			rpm: 10,
			rpd: 1000,
			tpm: 250000,
		},
		{
			modelName: 'Gemini 2.0 Flash-Lite',
			rpm: 30,
			rpd: 1500,
			tpm: 1000000,
		},
		{
			modelName: 'Gemini 1.5 Flash',
			rpm: 15,
			rpd: 500,
			tpm: 250000,
		},
		{
			modelName: 'Gemini 1.5 Flash-8B',
			rpm: 15,
			rpd: 500,
			tpm: 250000,
		},
		{modelName: 'Gemini 1.5 Pro', rpm: null, rpd: null, tpm: null},
		{modelName: 'Veo 2', rpm: null, rpd: null, tpm: null},
		{modelName: 'Imagen 3', rpm: null, rpd: null, tpm: null},
		{modelName: 'Gemma 3', rpm: 30, rpd: 14400, tpm: 15000},
		{modelName: 'Gemma 3n', rpm: 30, rpd: 14400, tpm: 15000},
		{
			modelName: 'Gemini Embedding Experimental 03-07',
			rpm: 5,
			rpd: 100,
			tpm: null,
		},
	];

	/**
	 * Rate limits for Live API models in the free tier.
	 */
	public static readonly liveApiModels: IGeminiRateLimit[] = [
		{
			modelName: 'Live API',
			concurrentSessions: 3,
			tpm: 1000000,
			rpm: null,
			rpd: null,
		},
		{
			modelName: 'Gemini 2.5 Flash Preview Native Audio Dialog',
			concurrentSessions: 1,
			tpm: 25000,
			rpm: null,
			rpd: 5,
		},
		{
			modelName: 'Gemini 2.5 Flash Experimental Native Audio Thinking Dialog',
			concurrentSessions: 1,
			tpm: 10000,
			rpm: null,
			rpd: 5,
		},
	];

	/**
	 * Finds the rate limit information for a specific model.
	 * @param modelName The name of the model to find.
	 * @returns The rate limit object or undefined if not found.
	 */
	public static findLimitForModel(
		modelName: string,
	): IGeminiRateLimit | undefined {
		return (
			this.standardModels.find(m => m.modelName === modelName) ||
			this.liveApiModels.find(m => m.modelName === modelName)
		);
	}
}
