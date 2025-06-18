#!/usr/bin/env tsx

/**
 * Live AI Decision Monitor
 *
 * Monitors and displays AI job matching decisions in real-time.
 * Useful for debugging job matching pipeline as it happens.
 */

import {connectToDatabase} from '@/lib/mongodb';
import {Log} from '@/models/Log';

interface MonitorOptions {
	userEmail?: string;
	showAccepted?: boolean;
	showRejected?: boolean;
	showBatchSummaries?: boolean;
	pollInterval?: number; // seconds
}

class AIDecisionMonitor {
	private lastTimestamp: Date;
	private options: MonitorOptions;
	private isRunning = false;

	constructor(options: MonitorOptions = {}) {
		this.lastTimestamp = new Date();
		this.options = {
			showAccepted: true,
			showRejected: true,
			showBatchSummaries: true,
			pollInterval: 5,
			...options,
		};
	}

	async start() {
		console.log('🔍 Starting AI Decision Monitor...');
		console.log(`👤 User filter: ${this.options.userEmail || 'All users'}`);
		console.log(
			`⚙️  Settings: Accept=${this.options.showAccepted}, Reject=${this.options.showRejected}, Summaries=${this.options.showBatchSummaries}`,
		);
		console.log(
			'📡 Monitoring for new AI decisions (press Ctrl+C to stop)...\n',
		);

		await connectToDatabase();
		this.isRunning = true;

		// Set up graceful shutdown
		process.on('SIGINT', () => {
			console.log('\n👋 Stopping monitor...');
			this.isRunning = false;
			process.exit(0);
		});

		// Main monitoring loop
		while (this.isRunning) {
			try {
				await this.checkForNewDecisions();
				await this.sleep(this.options.pollInterval! * 1000);
			} catch (error) {
				console.error('❌ Monitor error:', error);
				await this.sleep(5000); // Wait longer on error
			}
		}
	}

	private async checkForNewDecisions() {
		const query: any = {
			timestamp: {$gt: this.lastTimestamp},
			$or: [
				{message: {$regex: /AI rejected.*jobs/i}},
				{message: {$regex: /Batch Analysis Results/i}},
				{message: {$regex: /Deep analysis completed/i}},
				{message: {$regex: /Deal-breaker analysis/i}},
			],
		};

		if (this.options.userEmail) {
			query['context.userEmail'] = this.options.userEmail;
		}

		const newLogs = await Log.find(query).sort({timestamp: 1});

		if (newLogs.length === 0) {
			return;
		}

		// Update timestamp to most recent log
		this.lastTimestamp = newLogs[newLogs.length - 1].timestamp;

		// Process and display logs
		for (const log of newLogs) {
			this.displayLogEntry(log);
		}
	}

	private displayLogEntry(log: any) {
		const timestamp = new Date(log.timestamp).toLocaleTimeString();
		const userContext = log.context?.userEmail
			? ` [${log.context.userEmail}]`
			: '';

		if (log.message.includes('AI rejected') && this.options.showRejected) {
			console.log(`\n🚫 [${timestamp}]${userContext} AI REJECTIONS:`);

			const rejections = log.context?.rejections || [];
			rejections.forEach((job: any, index: number) => {
				console.log(`   ${index + 1}. "${job.title}"`);
				console.log(`      🔗 ${this.truncateUrl(job.url)}`);
				console.log(`      📍 ${job.location || 'Location not specified'}`);
				console.log(
					`      💼 ${job.experienceLevel || 'Experience level not specified'}`,
				);
				console.log(
					`      🛡️  Visa: ${
						job.visaSponsorshipOffered ? '✅' : '❌'
					} | Relocation: ${job.relocationAssistanceOffered ? '✅' : '❌'}`,
				);
				console.log(
					`      🗣️  Languages: ${
						job.languageRequirements?.length
							? job.languageRequirements.join(', ')
							: 'None specified'
					}`,
				);
				console.log(
					`      ⚠️  Issues: ${
						job.considerationPoints?.join(' | ') || 'None specified'
					}`,
				);
				if (job.techStack?.length) {
					console.log(
						`      🔧 Tech: ${job.techStack.slice(0, 3).join(', ')}${
							job.techStack.length > 3 ? '...' : ''
						}`,
					);
				}
			});
		} else if (
			log.message.includes('Deal-breaker analysis') &&
			this.options.showRejected
		) {
			console.log(`\n🔍 [${timestamp}]${userContext} DEAL-BREAKER ANALYSIS:`);

			const analyses = log.context || [];
			analyses.forEach((analysis: any, index: number) => {
				if (analysis.detectedDealBreakers?.length > 0) {
					console.log(`   ${index + 1}. "${analysis.title}"`);
					console.log(
						`      🚨 Deal-breakers: ${analysis.detectedDealBreakers.join(
							', ',
						)}`,
					);
					console.log(
						`      🤖 AI reasoning: ${
							analysis.aiConsiderationPoints?.join(' | ') || 'None'
						}`,
					);
				}
			});
		} else if (
			log.message.includes('Batch Analysis Results') &&
			this.options.showBatchSummaries
		) {
			console.log(`\n📊 [${timestamp}]${userContext} BATCH SUMMARY:`);
			console.log(`   📥 Analyzed: ${log.context?.batchSize || 'unknown'}`);
			console.log(`   ✅ Accepted: ${log.context?.acceptedPositions || 0}`);
			console.log(`   ❌ Rejected: ${log.context?.rejectedPositions || 0}`);
			console.log(
				`   📈 Total processed: ${log.context?.totalAnalyzed || 'unknown'}`,
			);
		} else if (
			log.message.includes('Deep analysis completed') &&
			this.options.showBatchSummaries
		) {
			console.log(`\n🎯 [${timestamp}]${userContext} ANALYSIS COMPLETE:`);
			const distribution = log.context?.scoreDistribution || {};
			console.log(`   🌟 Excellent (80+): ${distribution.excellent || 0}`);
			console.log(`   👍 Good (60-79): ${distribution.good || 0}`);
			console.log(`   👌 Fair (30-59): ${distribution.fair || 0}`);
			console.log(`   👎 Poor (1-29): ${distribution.poor || 0}`);
			console.log(`   ❌ Rejected (0): ${distribution.rejected || 0}`);

			if (log.context?.topScores?.length) {
				console.log(`   🏆 Top matches:`);
				log.context.topScores.forEach((job: any, index: number) => {
					console.log(
						`      ${index + 1}. "${job.title}" (${job.score}pts) - ${
							job.topReason
						}`,
					);
				});
			}
		}
	}

	private truncateUrl(url: string): string {
		if (url.length <= 50) return url;
		return url.substring(0, 47) + '...';
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

// CLI interface
if (require.main === module) {
	const args = process.argv.slice(2);

	if (args.includes('--help') || args.includes('-h')) {
		console.log(
			'AI Decision Monitor - Real-time monitoring of AI job matching decisions',
		);
		console.log('');
		console.log('Usage: npm run monitor-ai-decisions [options]');
		console.log('');
		console.log('Options:');
		console.log('  --user <email>        Monitor decisions for specific user');
		console.log('  --no-accepted         Hide accepted job notifications');
		console.log('  --no-rejected         Hide rejected job notifications');
		console.log('  --no-summaries        Hide batch summary notifications');
		console.log('  --interval <seconds>  Polling interval (default: 5)');
		console.log('  --help, -h            Show this help message');
		console.log('');
		console.log('Examples:');
		console.log('  npm run monitor-ai-decisions');
		console.log('  npm run monitor-ai-decisions -- --user user@example.com');
		console.log(
			'  npm run monitor-ai-decisions -- --no-accepted --interval 10',
		);
		process.exit(0);
	}

	const options: MonitorOptions = {};

	// Parse command line arguments
	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case '--user':
				options.userEmail = args[++i];
				break;
			case '--no-accepted':
				options.showAccepted = false;
				break;
			case '--no-rejected':
				options.showRejected = false;
				break;
			case '--no-summaries':
				options.showBatchSummaries = false;
				break;
			case '--interval':
				options.pollInterval = parseInt(args[++i]) || 5;
				break;
		}
	}

	const monitor = new AIDecisionMonitor(options);
	monitor.start().catch(error => {
		console.error('❌ Monitor failed to start:', error);
		process.exit(1);
	});
}

export {AIDecisionMonitor};
