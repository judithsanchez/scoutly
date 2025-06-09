import mongoose, {Schema, Document} from 'mongoose';

export enum WorkModel {
	FULLY_REMOTE = 'FULLY_REMOTE',
	HYBRID = 'HYBRID',
	IN_OFFICE = 'IN_OFFICE',
}

export interface ICompany extends Document {
	companyID: string;
	company: string;
	careers_url: string;
	selector: string;
	work_model: WorkModel;
	headquarters: string;
	office_locations: string[];
	fields: string[];
	openToApplication: boolean;
	lastSuccessfulScrape?: Date;
	isProblematic: boolean;
	scrapeErrors: mongoose.Schema.Types.ObjectId[];
}

const CompanySchema = new Schema<ICompany>(
	{
		companyID: {
			type: String,
			required: true,
			unique: true,
		},
		company: {
			type: String,
			required: true,
		},
		careers_url: {
			type: String,
			required: true,
		},
		selector: {
			type: String,
			default: '',
		},
		work_model: {
			type: String,
			enum: Object.values(WorkModel),
			required: true,
		},
		headquarters: {
			type: String,
			required: true,
		},
		office_locations: [
			{
				type: String,
			},
		],
		fields: [
			{
				type: String,
			},
		],
		openToApplication: {
			type: Boolean,
			default: false,
			required: true,
		},
		lastSuccessfulScrape: {
			type: Date,
		},
		isProblematic: {
			type: Boolean,
			default: false,
		},
		scrapeErrors: [
			{
				type: Schema.Types.ObjectId,
				ref: 'ScrapeError',
			},
		],
	},
	{
		timestamps: true,
	},
);

// Create compound index for error tracking
CompanySchema.index({isProblematic: 1, lastSuccessfulScrape: 1});

// Check if model exists before compiling
export const Company =
	mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
