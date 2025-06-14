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
	 * Model pricing per 1M tokens
	 * Example calculation:
	 * - Input tokens: 100,000 × ($0.075/1M) = $0.0075
	 * - Output tokens: 50,000 × ($0.30/1M) = $0.015
	 * - Total cost: $0.0225
	 */
	pricing?: {
		input: number; // Price per 1M input tokens ($0.075 per 1M)
		output: number; // Price per 1M output tokens ($0.30 per 1M)
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
				input: 0.075, // $0.075 per 1M input tokens
				output: 0.3, // $0.30 per 1M output tokens
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
