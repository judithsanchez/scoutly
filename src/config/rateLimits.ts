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
	/**
	 * Model pricing per 1K tokens
	 */
	pricing?: {
		input: number; // Price per 1K input tokens ($0.075)
		output: number; // Price per 1K output tokens ($0.30)
	};
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
			modelName: 'gemini-2.0-flash-lite',
			rpm: 30,
			rpd: 1500,
			tpm: 1000000,
			pricing: {
				input: 0.075, // $0.075 per 1K input tokens
				output: 0.3, // $0.30 per 1K output tokens
			},
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
		return this.standardModels.find(m => m.modelName === modelName);
	}
}
