import {
	TokenUsage,
	type ITokenUsage,
	TokenOperation,
} from '@/models/TokenUsage';
import {connectDB} from '@/config/database';
import {Logger} from '@/utils/logger';
import type {PipelineStage} from 'mongoose';

const logger = new Logger('TokenUsageService');

class TokenUsageError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message);
		this.name = 'TokenUsageError';
	}
}

interface TimeframeFilter {
	start?: Date;
	end?: Date;
}

interface TokenUsageInput {
	processId: string;
	operation: TokenOperation;
	estimatedTokens: number;
	actualTokens: number;
	inputTokens: number;
	outputTokens: number;
	costEstimate: {
		input: number;
		output: number;
		total: number;
		currency: string;
		isFreeUsage: boolean;
	};
	userEmail: string;
	companyId: string;
	companyName: string;
}

interface TokenUsageStats {
	totalTokens: number;
	totalCost: number;
	averageTokensPerCall: number;
	totalCalls: number;
	estimationAccuracy: number;
}

export class TokenUsageService {
	private static async executeStatsQuery(
		query: Record<string, any>,
	): Promise<TokenUsageStats> {
		try {
			await connectDB();
			const usageData = await TokenUsage.aggregate([
				{$match: query},
				{
					$group: {
						_id: null,
						totalTokens: {$sum: '$actualTokens'},
						totalCost: {$sum: '$costEstimate.total'},
						totalCalls: {$sum: 1},
						totalEstimated: {$sum: '$estimatedTokens'},
						totalActual: {$sum: '$actualTokens'},
					},
				},
			]);

			if (usageData.length === 0) {
				return {
					totalTokens: 0,
					totalCost: 0,
					averageTokensPerCall: 0,
					totalCalls: 0,
					estimationAccuracy: 100,
				};
			}

			const stats = usageData[0];
			return {
				totalTokens: stats.totalTokens,
				totalCost: stats.totalCost,
				averageTokensPerCall: Math.round(stats.totalTokens / stats.totalCalls),
				totalCalls: stats.totalCalls,
				estimationAccuracy: parseFloat(
					(
						(stats.totalActual / Math.max(stats.totalEstimated, 1)) *
						100
					).toFixed(2),
				),
			};
		} catch (error) {
			throw new TokenUsageError('Failed to execute stats query', error);
		}
	}

	private static buildTimeframeQuery(
		baseQuery: Record<string, any>,
		timeframe?: TimeframeFilter,
	): Record<string, any> {
		const query = {...baseQuery};
		if (timeframe) {
			query.timestamp = {};
			if (timeframe.start) query.timestamp.$gte = timeframe.start;
			if (timeframe.end) query.timestamp.$lte = timeframe.end;
		}
		return query;
	}

	public static async getUsageTrends(
		timeframe: TimeframeFilter,
		granularity: 'day' | 'week' | 'month' = 'day',
	) {
		try {
			await connectDB();
			const query = this.buildTimeframeQuery({}, timeframe);
			const pipeline = [
				{$match: query},
				{
					$group: {
						_id: {
							$dateToString: {
								format:
									granularity === 'day'
										? '%Y-%m-%d'
										: granularity === 'week'
										? '%Y-W%V'
										: '%Y-%m',
								date: '$timestamp',
							},
						},
						totalTokens: {$sum: '$actualTokens'},
						totalCost: {$sum: '$costEstimate.total'},
						operations: {$addToSet: '$operation'},
					},
				},
				{$sort: {_id: 1 as const}},
			];

			const trends = await TokenUsage.aggregate(pipeline);
			return trends.map(trend => ({
				period: trend._id,
				totalTokens: trend.totalTokens,
				totalCost: trend.totalCost,
				uniqueOperations: trend.operations,
			}));
		} catch (error) {
			throw new TokenUsageError('Failed to get usage trends', error);
		}
	}

	public static async getModelPerformanceMetrics(timeframe?: TimeframeFilter) {
		try {
			await connectDB();
			const query = this.buildTimeframeQuery({}, timeframe);
			const pipeline = [
				{$match: query},
				{
					$group: {
						_id: '$operation',
						avgAccuracy: {
							$avg: {
								$multiply: [
									{$divide: ['$actualTokens', {$max: ['$estimatedTokens', 1]}]},
									100,
								],
							},
						},
						totalCalls: {$sum: 1},
						avgTokensPerCall: {$avg: '$actualTokens'},
						totalCost: {$sum: '$costEstimate.total'},
					},
				},
			];

			return await TokenUsage.aggregate(pipeline);
		} catch (error) {
			throw new TokenUsageError(
				'Failed to get model performance metrics',
				error,
			);
		}
	}

	public static async recordUsage(
		usage: TokenUsageInput,
	): Promise<ITokenUsage> {
		try {
			await connectDB();
			const tokenUsage = await TokenUsage.create({
				...usage,
				timestamp: new Date(),
			});

			logger.debug('Token usage recorded', {
				operation: usage.operation,
				tokens: {
					estimated: usage.estimatedTokens,
					actual: usage.actualTokens,
					accuracy:
						(
							(usage.actualTokens / Math.max(usage.estimatedTokens, 1)) *
							100
						).toFixed(2) + '%',
				},
				cost: usage.costEstimate,
			});

			return tokenUsage;
		} catch (error) {
			const tokenError = new TokenUsageError(
				'Failed to record token usage',
				error,
			);
			logger.error(tokenError.message, error);
			throw tokenError;
		}
	}

	public static async getUserStats(
		userEmail: string,
		timeframe?: TimeframeFilter,
	): Promise<TokenUsageStats> {
		try {
			await connectDB();
			const query = this.buildTimeframeQuery({userEmail}, timeframe);
			return await this.executeStatsQuery(query);
		} catch (error) {
			logger.error('Failed to get user token usage stats:', error);
			throw error;
		}
	}

	public static async getCompanyStats(
		companyId: string,
		timeframe?: TimeframeFilter,
	): Promise<TokenUsageStats> {
		try {
			await connectDB();
			const query = this.buildTimeframeQuery({companyId}, timeframe);
			return await this.executeStatsQuery(query);
		} catch (error) {
			logger.error('Failed to get company token usage stats:', error);
			throw error;
		}
	}

	public static async getOperationStats(
		operation: TokenOperation,
		timeframe?: TimeframeFilter,
	): Promise<TokenUsageStats> {
		try {
			await connectDB();
			const query = this.buildTimeframeQuery({operation}, timeframe);
			return await this.executeStatsQuery(query);
		} catch (error) {
			throw new TokenUsageError(
				'Failed to get operation token usage stats',
				error,
			);
		}
	}

	public static async getCostBreakdownByPeriod(
		timeframe: TimeframeFilter,
		granularity: 'hour' | 'day' | 'week' | 'month' = 'day',
	) {
		try {
			await connectDB();
			const query = this.buildTimeframeQuery({}, timeframe);
			const pipeline = [
				{$match: query},
				{
					$group: {
						_id: {
							period: {
								$dateToString: {
									format:
										granularity === 'hour'
											? '%Y-%m-%d-%H'
											: granularity === 'day'
											? '%Y-%m-%d'
											: granularity === 'week'
											? '%Y-W%V'
											: '%Y-%m',
									date: '$timestamp',
								},
							},
							operation: '$operation',
						},
						totalCost: {$sum: '$costEstimate.total'},
						inputCost: {$sum: '$costEstimate.input'},
						outputCost: {$sum: '$costEstimate.output'},
						totalTokens: {$sum: '$actualTokens'},
					},
				},
				{
					$group: {
						_id: '$_id.period',
						operations: {
							$push: {
								operation: '$_id.operation',
								costs: {
									total: '$totalCost',
									input: '$inputCost',
									output: '$outputCost',
								},
								tokens: '$totalTokens',
							},
						},
						periodTotalCost: {$sum: '$totalCost'},
						periodTotalTokens: {$sum: '$totalTokens'},
					},
				},
				{$sort: {_id: 1 as const}},
			] satisfies PipelineStage[];

			return await TokenUsage.aggregate(pipeline);
		} catch (error) {
			throw new TokenUsageError('Failed to get cost breakdown', error);
		}
	}
}
