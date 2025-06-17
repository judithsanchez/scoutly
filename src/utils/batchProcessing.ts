/**
 * Batch processing utilities for handling large datasets efficiently
 */

import {Logger} from './logger';

const logger = new Logger('BatchProcessing');

/**
 * Splits an array into batches of specified size
 *
 * @param items - Array of items to batch
 * @param batchSize - Maximum size of each batch
 * @returns Array of batches
 */
export function createBatches<T>(items: T[], batchSize: number): T[][] {
	const batches: T[][] = [];

	for (let i = 0; i < items.length; i += batchSize) {
		batches.push(items.slice(i, i + batchSize));
	}

	return batches;
}

/**
 * Processes items in parallel batches with a maximum concurrency limit
 *
 * @param items - Items to process
 * @param processor - Function to process each item
 * @param maxConcurrency - Maximum number of parallel operations
 * @returns Array of results
 */
export async function processInParallelBatches<T, R>(
	items: T[],
	processor: (item: T, index: number) => Promise<R>,
	maxConcurrency: number = 3,
): Promise<(R | null)[]> {
	const results: (R | null)[] = new Array(items.length).fill(null);
	const batches = createBatches(items, maxConcurrency);

	for (const batch of batches) {
		const batchPromises = batch.map(async (item, batchIndex) => {
			const originalIndex = items.indexOf(item);
			try {
				const result = await processor(item, originalIndex);
				results[originalIndex] = result;
				return result;
			} catch (error) {
				logger.error(
					`Failed to process item at index ${originalIndex}:`,
					error,
				);
				return null;
			}
		});

		await Promise.all(batchPromises);
	}

	return results;
}

/**
 * Processes batches sequentially with logging
 *
 * @param batches - Array of batches to process
 * @param processor - Function to process each batch
 * @param batchName - Name for logging purposes
 * @returns Array of results from all batches
 */
export async function processSequentialBatches<T, R>(
	batches: T[][],
	processor: (batch: T[], batchIndex: number) => Promise<R[]>,
	batchName: string = 'items',
): Promise<R[]> {
	const allResults: R[] = [];

	logger.info(
		`Processing ${batches.reduce(
			(total, batch) => total + batch.length,
			0,
		)} ${batchName} in ${batches.length} batches...`,
	);

	for (let i = 0; i < batches.length; i++) {
		const batch = batches[i];
		logger.info(
			`Processing batch ${i + 1}/${batches.length} (${
				batch.length
			} ${batchName})...`,
		);

		try {
			const batchResults = await processor(batch, i);
			allResults.push(...batchResults);
		} catch (error: any) {
			logger.error(`Failed to process batch ${i + 1}:`, {error});
		}
	}

	return allResults;
}

/**
 * Adds random delay between operations to avoid overwhelming services
 *
 * @param baseDelay - Base delay in milliseconds
 * @param randomRange - Random additional delay range in milliseconds
 */
export async function addRandomDelay(
	baseDelay: number = 2000,
	randomRange: number = 2000,
): Promise<void> {
	const delay = baseDelay + Math.random() * randomRange;
	await new Promise(resolve => setTimeout(resolve, delay));
}
