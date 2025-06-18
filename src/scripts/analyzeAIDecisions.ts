#!/usr/bin/env tsx

/**
 * AI Decision Analysis Tool
 *
 * Analyzes logs to understand AI job matching decisions and rejection patterns.
 * Useful for debugging why certain jobs are not being matched or saved.
 */

import {connectToDatabase} from '@/lib/mongodb';
import {Log} from '@/models/Log';

interface AIRejectionAnalysis {
	totalRejections: number;
	dealBreakerCategories: {
		visaSponsorship: number;
		languageRequirements: number;
		experienceMismatch: number;
		techStackMismatch: number;
		locationMismatch: number;
		other: number;
	};
	commonRejectionReasons: Array<{
		reason: string;
		count: number;
		examples: string[];
	}>;
	companyRejectionPatterns: Array<{
		company: string;
		totalJobs: number;
		rejectedJobs: number;
		rejectionRate: number;
		commonReasons: string[];
	}>;
}

async function analyzeAIDecisions(
	userEmail?: string,
	daysBack: number = 7,
): Promise<AIRejectionAnalysis> {
	await connectToDatabase();

	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysBack);

	// Query for AI rejection logs
	const query: any = {
		level: 'warn',
		message: {$regex: /AI rejected.*jobs/i},
		timestamp: {$gte: cutoffDate},
	};

	if (userEmail) {
		query['context.userEmail'] = userEmail;
	}

	console.log(
		`🔍 Analyzing AI decisions from the last ${daysBack} days${
			userEmail ? ` for user: ${userEmail}` : ''
		}...`,
	);

	const rejectionLogs = await Log.find(query).sort({timestamp: -1});

	console.log(`📊 Found ${rejectionLogs.length} rejection log entries`);

	const analysis: AIRejectionAnalysis = {
		totalRejections: 0,
		dealBreakerCategories: {
			visaSponsorship: 0,
			languageRequirements: 0,
			experienceMismatch: 0,
			techStackMismatch: 0,
			locationMismatch: 0,
			other: 0,
		},
		commonRejectionReasons: [],
		companyRejectionPatterns: [],
	};

	const rejectionReasons: Map<string, {count: number; examples: string[]}> =
		new Map();
	const companyData: Map<
		string,
		{total: number; rejected: number; reasons: string[]}
	> = new Map();

	// Process each rejection log
	for (const log of rejectionLogs) {
		const rejections = log.context?.rejections || [];
		analysis.totalRejections += rejections.length;

		for (const rejection of rejections) {
			// Extract company from URL
			const company = extractCompanyFromUrl(rejection.url);
			if (!companyData.has(company)) {
				companyData.set(company, {total: 0, rejected: 0, reasons: []});
			}
			const companyStats = companyData.get(company)!;
			companyStats.rejected++;

			// Analyze consideration points for patterns
			const considerations = rejection.considerationPoints || [];
			for (const point of considerations) {
				// Categorize deal-breakers
				if (
					point.toLowerCase().includes('visa') ||
					point.toLowerCase().includes('sponsorship')
				) {
					analysis.dealBreakerCategories.visaSponsorship++;
					companyStats.reasons.push('Visa sponsorship');
				} else if (
					point.toLowerCase().includes('language') ||
					point.toLowerCase().includes('fluent')
				) {
					analysis.dealBreakerCategories.languageRequirements++;
					companyStats.reasons.push('Language requirements');
				} else if (
					point.toLowerCase().includes('experience') ||
					point.toLowerCase().includes('junior') ||
					point.toLowerCase().includes('senior')
				) {
					analysis.dealBreakerCategories.experienceMismatch++;
					companyStats.reasons.push('Experience mismatch');
				} else if (
					point.toLowerCase().includes('tech') ||
					point.toLowerCase().includes('stack') ||
					point.toLowerCase().includes('technology')
				) {
					analysis.dealBreakerCategories.techStackMismatch++;
					companyStats.reasons.push('Tech stack mismatch');
				} else if (
					point.toLowerCase().includes('location') ||
					point.toLowerCase().includes('timezone')
				) {
					analysis.dealBreakerCategories.locationMismatch++;
					companyStats.reasons.push('Location/timezone');
				} else {
					analysis.dealBreakerCategories.other++;
				}

				// Track common rejection reasons
				if (!rejectionReasons.has(point)) {
					rejectionReasons.set(point, {count: 0, examples: []});
				}
				const reasonData = rejectionReasons.get(point)!;
				reasonData.count++;
				if (reasonData.examples.length < 3) {
					reasonData.examples.push(`${rejection.title} at ${company}`);
				}
			}
		}
	}

	// Also check for deal-breaker analysis logs
	const dealBreakerQuery = {
		...query,
		message: {$regex: /Deal-breaker analysis/i},
	};

	const dealBreakerLogs = await Log.find(dealBreakerQuery);

	for (const log of dealBreakerLogs) {
		const analyses = log.context || [];
		for (const analysis_item of analyses) {
			if (analysis_item.detectedDealBreakers) {
				for (const dealBreaker of analysis_item.detectedDealBreakers) {
					if (dealBreaker.includes('visa')) {
						analysis.dealBreakerCategories.visaSponsorship++;
					} else if (dealBreaker.includes('language')) {
						analysis.dealBreakerCategories.languageRequirements++;
					}
				}
			}
		}
	}

	// Convert maps to arrays and sort
	analysis.commonRejectionReasons = Array.from(rejectionReasons.entries())
		.map(([reason, data]) => ({
			reason,
			count: data.count,
			examples: data.examples,
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10); // Top 10

	analysis.companyRejectionPatterns = Array.from(companyData.entries())
		.map(([company, data]) => ({
			company,
			totalJobs: data.total || data.rejected, // We only track rejected jobs in this analysis
			rejectedJobs: data.rejected,
			rejectionRate: data.total ? (data.rejected / data.total) * 100 : 100,
			commonReasons: [...new Set(data.reasons)].slice(0, 5),
		}))
		.filter(item => item.rejectedJobs > 0)
		.sort((a, b) => b.rejectedJobs - a.rejectedJobs)
		.slice(0, 10); // Top 10

	return analysis;
}

function extractCompanyFromUrl(url: string): string {
	try {
		const domain = new URL(url).hostname.toLowerCase();
		// Remove common prefixes and suffixes
		return domain
			.replace(/^(www\.|careers\.|jobs\.)/, '')
			.replace(/\.(com|org|net|io|co\.uk|de|fr|nl)$/, '')
			.split('.')[0];
	} catch {
		return 'unknown';
	}
}

function printAnalysis(analysis: AIRejectionAnalysis) {
	console.log('\n🎯 AI DECISION ANALYSIS REPORT');
	console.log('=====================================');

	console.log(`\n📊 OVERVIEW:`);
	console.log(`   Total Rejected Jobs: ${analysis.totalRejections}`);

	console.log(`\n🚫 DEAL-BREAKER CATEGORIES:`);
	console.log(
		`   Visa Sponsorship Issues: ${analysis.dealBreakerCategories.visaSponsorship}`,
	);
	console.log(
		`   Language Requirements: ${analysis.dealBreakerCategories.languageRequirements}`,
	);
	console.log(
		`   Experience Mismatches: ${analysis.dealBreakerCategories.experienceMismatch}`,
	);
	console.log(
		`   Tech Stack Mismatches: ${analysis.dealBreakerCategories.techStackMismatch}`,
	);
	console.log(
		`   Location/Timezone Issues: ${analysis.dealBreakerCategories.locationMismatch}`,
	);
	console.log(`   Other Reasons: ${analysis.dealBreakerCategories.other}`);

	console.log(`\n🔍 TOP REJECTION REASONS:`);
	analysis.commonRejectionReasons.forEach((reason, index) => {
		console.log(`   ${index + 1}. "${reason.reason}" (${reason.count}x)`);
		console.log(`      Examples: ${reason.examples.join(', ')}`);
	});

	console.log(`\n🏢 COMPANY REJECTION PATTERNS:`);
	analysis.companyRejectionPatterns.forEach((company, index) => {
		console.log(
			`   ${index + 1}. ${company.company}: ${
				company.rejectedJobs
			} rejected jobs`,
		);
		console.log(`      Common reasons: ${company.commonReasons.join(', ')}`);
	});

	console.log('\n💡 INSIGHTS & RECOMMENDATIONS:');

	if (
		analysis.dealBreakerCategories.visaSponsorship >
		analysis.totalRejections * 0.3
	) {
		console.log('   ⚠️  High visa sponsorship rejection rate detected');
		console.log('      Consider focusing job search on EU-based companies or');
		console.log('      companies that explicitly mention visa sponsorship');
	}

	if (analysis.dealBreakerCategories.languageRequirements > 0) {
		console.log('   🗣️  Language requirements causing rejections');
		console.log(
			'      Consider highlighting multilingual abilities in profile',
		);
	}

	if (
		analysis.dealBreakerCategories.experienceMismatch >
		analysis.totalRejections * 0.2
	) {
		console.log('   📈 Experience level mismatches detected');
		console.log(
			'      AI may be correctly filtering jobs outside your experience level',
		);
		console.log('      or detecting domain transfer penalties');
	}

	console.log('\n=====================================\n');
}

// Main execution
if (require.main === module) {
	const userEmail = process.argv[2];
	const daysBack = parseInt(process.argv[3]) || 7;

	if (process.argv.includes('--help') || process.argv.includes('-h')) {
		console.log('Usage: npm run analyze-ai-decisions [userEmail] [daysBack]');
		console.log('');
		console.log('Arguments:');
		console.log('  userEmail  - Optional: analyze decisions for specific user');
		console.log(
			'  daysBack   - Optional: number of days to look back (default: 7)',
		);
		console.log('');
		console.log('Examples:');
		console.log('  npm run analyze-ai-decisions');
		console.log('  npm run analyze-ai-decisions user@example.com');
		console.log('  npm run analyze-ai-decisions user@example.com 14');
		process.exit(0);
	}

	analyzeAIDecisions(userEmail, daysBack)
		.then(printAnalysis)
		.catch(error => {
			console.error('❌ Analysis failed:', error);
			process.exit(1);
		});
}

export {analyzeAIDecisions, printAnalysis};
