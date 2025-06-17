// This file contains only the types needed for the client side
// without importing the mongoose model

export enum WorkModel {
	FULLY_REMOTE = 'FULLY_REMOTE',
	HYBRID = 'HYBRID',
	IN_OFFICE = 'IN_OFFICE',
}

export interface ICompany {
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
	scrapeErrors: string[]; // Changed to string[] from mongoose.Schema.Types.ObjectId[]
	createdAt?: Date;
	updatedAt?: Date;
}

// This interface is for creating a new company
export interface CreateCompanyInput {
	companyID: string;
	company: string;
	careers_url: string;
	work_model: WorkModel;
	headquarters: string;
	fields: string[];
	office_locations?: string[];
	selector?: string;
	openToApplication?: boolean;
}
