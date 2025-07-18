import mongoose, {Schema, Document} from 'mongoose';

export interface ScrapeLink {
	url: string;
	text: string;
	context: string;
	title?: string;
}

export interface ICompanyScrapeHistory extends Document {
   companyId: mongoose.Schema.Types.ObjectId;
   userId: string;
   lastScrapeDate: Date;
   links: ScrapeLink[];
   createdAt: Date;
   updatedAt: Date;
}

const ScrapedLinkSchema = new Schema(
	{
		url: {type: String, required: true},
		text: {type: String, required: true},
		context: {type: String, required: true},
		title: String,
	},
	{_id: false},
); // Disable _id for subdocuments since we'll use url as identifier

const CompanyScrapeHistorySchema = new Schema<ICompanyScrapeHistory>(
	{
		companyId: {
			type: Schema.Types.ObjectId,
			ref: 'Company',
			required: true,
		},
   userId: {
	   type: String,
	   required: true,
	   trim: true,
   },
		lastScrapeDate: {
			type: Date,
			required: true,
			default: Date.now,
		},
		links: [ScrapedLinkSchema],
	},
	{
		timestamps: true,
	},
);

// Create a compound index to ensure uniqueness of company-user pairs
CompanyScrapeHistorySchema.index({companyId: 1, userId: 1}, {unique: true});

// Check if the model exists before compiling it
export const CompanyScrapeHistory =
	mongoose.models.CompanyScrapeHistory ||
	mongoose.model<ICompanyScrapeHistory>(
		'CompanyScrapeHistory',
		CompanyScrapeHistorySchema,
	);
