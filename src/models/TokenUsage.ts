import mongoose, {Schema, Document} from 'mongoose';

export enum TokenOperation {
	INITIAL_MATCHING = 'initial_matching',
	DEEP_DIVE_ANALYSIS = 'deep_dive_analysis',
	JOB_BATCH_ANALYSIS = 'job_batch_analysis',
}

export interface ITokenUsage extends Document {
	processId: string;
	timestamp: Date;
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

const TokenUsageSchema = new Schema<ITokenUsage>(
	{
		processId: {type: String, required: true},
		timestamp: {type: Date, required: true, default: Date.now},
		operation: {
			type: String,
			required: true,
			enum: Object.values(TokenOperation),
		},
		estimatedTokens: {type: Number, required: true},
		actualTokens: {type: Number, required: true},
		inputTokens: {type: Number, required: true},
		outputTokens: {type: Number, required: true},
		costEstimate: {
			input: {type: Number, required: true},
			output: {type: Number, required: true},
			total: {type: Number, required: true},
			currency: {type: String, required: true, default: 'USD'},
			isFreeUsage: {type: Boolean, required: true, default: true},
		},
		companyName: {type: String, required: true},
		userEmail: {type: String, required: true},
		companyId: {type: String, required: true},
	},
	{
		timestamps: true,
	},
);

TokenUsageSchema.index({processId: 1});
TokenUsageSchema.index({userEmail: 1});
TokenUsageSchema.index({timestamp: -1});
TokenUsageSchema.index({companyId: 1});

TokenUsageSchema.index({userEmail: 1, timestamp: -1});
TokenUsageSchema.index({companyId: 1, timestamp: -1});
TokenUsageSchema.index({operation: 1, timestamp: -1});
TokenUsageSchema.index({userEmail: 1, operation: 1, timestamp: -1});

TokenUsageSchema.statics.getTokensInTimeframe = async function (
	startDate: Date,
	endDate: Date,
	filters: {
		userEmail?: string;
		companyId?: string;
		operation?: TokenOperation;
	} = {},
) {
	const match: any = {
		timestamp: {
			$gte: startDate,
			$lte: endDate,
		},
	};

	if (filters.userEmail) match.userEmail = filters.userEmail;
	if (filters.companyId) match.companyId = filters.companyId;
	if (filters.operation) match.operation = filters.operation;

	const result = await this.aggregate([
		{$match: match},
		{
			$group: {
				_id: null,
				totalTokens: {$sum: '$actualTokens'},
				totalCost: {$sum: '$costEstimate.total'},
				averageAccuracy: {
					$avg: {
						$multiply: [
							{$divide: ['$actualTokens', {$max: ['$estimatedTokens', 1]}]},
							100,
						],
					},
				},
			},
		},
	]);

	return (
		result[0] || {
			totalTokens: 0,
			totalCost: 0,
			averageAccuracy: 100,
		}
	);
};

TokenUsageSchema.methods.getAccuracyPercentage = function (): number {
	return (this.actualTokens / Math.max(this.estimatedTokens, 1)) * 100;
};

export const TokenUsage =
	mongoose.models.TokenUsage ||
	mongoose.model<ITokenUsage>('TokenUsage', TokenUsageSchema);
