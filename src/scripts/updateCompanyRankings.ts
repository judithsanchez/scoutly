import {connectDB} from '../config/database';
import {CompanyService} from '../services/companyService';

async function updateCompanyRankings() {
	try {
		await connectDB();
		console.log('Connected to database');

		// Get all companies
		const companies = await CompanyService.getAllCompanies();
		console.log(`Found ${companies.length} companies to update`);

		// Update each company's ranking to 75
		// NOTE: This script is currently disabled as the ranking functionality
		// has been moved to the user's tracked companies relationship.
		// TODO: Either rewrite this script to work with the new architecture
		// or remove it if it's no longer needed.
		/*
		for (const company of companies) {
			await CompanyService.updateCompanyRanking(company.companyID, 75);
		}
		*/

		console.log(
			'Script is currently disabled - ranking functionality has been moved to user tracked companies',
		);

		// Give time for any pending operations to complete
		setTimeout(() => process.exit(0), 1000);
	} catch (error) {
		console.error('Error updating company rankings:', error);
		setTimeout(() => process.exit(1), 1000);
	}
}

// Run the update function
updateCompanyRankings();
