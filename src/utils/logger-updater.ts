#!/usr/bin/env tsx

/**
 * Logger Updater Script
 *
 * This script helps update scripts from SimpleLogger to EnhancedLogger.
 * It reads a file, transforms the logger imports and usage, and writes the result.
 *
 * Usage: npx tsx src/utils/logger-updater.ts <file-path>
 */

import fs from 'fs';
import path from 'path';

// Define the file to update as a command line argument
const filePath = process.argv[2];

if (!filePath) {
	console.error('Please provide a file path to update');
	process.exit(1);
}

// Read the file content
try {
	const content = fs.readFileSync(filePath, 'utf8');

	// Replace SimpleLogger import with EnhancedLogger
	let updatedContent = content.replace(
		/import\s+\{\s*SimpleLogger\s*\}\s+from\s+['"]\.\.\/utils\/simpleLogger['"]/g,
		"import { EnhancedLogger } from '../utils/enhancedLogger'",
	);

	// Replace SimpleLogger constructor with EnhancedLogger.getLogger
	updatedContent = updatedContent.replace(
		/const\s+logger\s+=\s+new\s+SimpleLogger\(['"](.*?)['"].*?\)/g,
		"const logger = EnhancedLogger.getLogger('$1', {\n" +
			'  logToFile: true,\n' +
			'  logToConsole: true,\n' +
			"  logDir: '/tmp/scoutly-logs',\n" +
			"  logFileName: '$1.log'.toLowerCase()\n" +
			'})',
	);

	// Write the updated content back to the file
	fs.writeFileSync(filePath, updatedContent, 'utf8');

	console.log(`Updated logger in ${filePath}`);
} catch (error) {
	console.error(`Error updating ${filePath}:`, error);
	process.exit(1);
}
