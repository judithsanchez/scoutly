// This file contains only the types needed for the client side
// without importing the mongoose model

export enum WorkModel {
	FULLY_REMOTE = 'FULLY_REMOTE',
	HYBRID = 'HYBRID',
	IN_OFFICE = 'IN_OFFICE',
}

// Keep this in sync with CompanyZodSchema in src/schemas/companySchemas.ts
export interface ICompany {
	companyID: string;
	company: string;
	description?: string;
	website?: string;
	logo_url?: string;
	careers_url?: string;
	industry?: string;
	size?: string;
	headquarters?: string;
	founded?: number;
	work_model?: WorkModel;
	lastScraped?: Date;
	createdAt?: Date;
	updatedAt?: Date;
	selector?: string;
	office_locations?: string[];
	fields?: string[];
	openToApplication?: boolean;
	lastSuccessfulScrape?: Date;
	isProblematic?: boolean;
	scrapeErrors?: string[];
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
