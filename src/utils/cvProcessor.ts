/**
 * CV processing utilities for handling document extraction and text processing
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {spawn} from 'child_process';
import {Logger} from './logger';

const logger = new Logger('CVProcessor');

/**
 * Extracts the file ID from a Google Drive URL
 *
 * @param url - Google Drive URL
 * @returns File ID or null if not found
 */
export function extractGoogleDriveFileId(url: URL): string | null {
	if (url.hostname !== 'drive.google.com') {
		return null;
	}

	const match = url.pathname.match(/\/d\/([^/]+)/);
	return match ? match[1] : null;
}

/**
 * Downloads a file from Google Drive using the file ID
 *
 * @param fileId - Google Drive file ID
 * @returns Buffer containing the file data
 */
export async function downloadFromGoogleDrive(
	fileId: string,
): Promise<ArrayBuffer> {
	const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
	const response = await fetch(downloadUrl);

	if (!response.ok) {
		throw new Error(`Failed to download file: ${response.statusText}`);
	}

	return await response.arrayBuffer();
}

/**
 * Extracts text from a PDF file using Python script
 *
 * @param pdfPath - Path to the PDF file
 * @returns Promise resolving to extracted text
 */
export function extractTextFromPdf(pdfPath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const pythonProcess = spawn('python3', [
			'src/scripts/pdf_extractor.py',
			pdfPath,
		]);

		let extractedText = '';
		let errorOutput = '';

		pythonProcess.stdout.on('data', data => {
			extractedText += data.toString();
		});

		pythonProcess.stderr.on('data', data => {
			errorOutput += data.toString();
		});

		pythonProcess.on('close', async code => {
			// Clean up temp file
			try {
				await fs.unlink(pdfPath);
			} catch (e) {
				logger.warn(`Failed to delete temp file: ${pdfPath}`, e);
			}

			if (code !== 0) {
				logger.error('Python script exited with error code:', {
					code,
					errorOutput,
				});
				reject(new Error(`Python script failed: ${errorOutput}`));
			} else {
				logger.success(
					'Successfully extracted text from CV via Python script.',
				);
				resolve(extractedText);
			}
		});

		pythonProcess.on('error', async err => {
			logger.error('Failed to spawn Python script.', err);
			try {
				await fs.unlink(pdfPath);
			} catch (e) {
				logger.warn(`Failed to delete temp file: ${pdfPath}`, e);
			}
			reject(err);
		});
	});
}

/**
 * Processes a CV from a URL and extracts text content
 *
 * @param cvUrl - URL to the CV (Google Drive supported)
 * @returns Promise resolving to extracted text content
 */
export async function getCvContentAsText(cvUrl: string): Promise<string> {
	logger.info('Processing CV from URL using Python helper...', {url: cvUrl});

	const tempFilePath = path.join(os.tmpdir(), `cv-${Date.now()}.pdf`);

	try {
		const url = new URL(cvUrl);
		const fileId = extractGoogleDriveFileId(url);

		if (!fileId) {
			throw new Error('Could not extract file ID from Google Drive URL.');
		}

		// Download the file
		const pdfBuffer = await downloadFromGoogleDrive(fileId);
		await fs.writeFile(tempFilePath, Buffer.from(pdfBuffer));
		logger.debug(`PDF saved temporarily to: ${tempFilePath}`);

		// Extract text using Python script
		return await extractTextFromPdf(tempFilePath);
	} catch (error) {
		logger.error('Failed to process CV from Google Drive link.', error);

		// Clean up temp file if it exists
		try {
			await fs.unlink(tempFilePath);
		} catch (cleanupError) {
			// Ignore cleanup errors
		}

		throw new Error('Could not read CV content from the provided URL.');
	}
}
