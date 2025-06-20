/**
 * Integration test script to verify TokenUsage database persistence
 * This will test the actual database connection and record creation
 */

import { connectToDatabase } from '@/lib/mongodb';
import { TokenUsageService } from '@/services/tokenUsageService';
import { TokenOperation } from '@/models/TokenUsage';

async function testTokenUsageDatabase() {
	console.log('🔍 Testing TokenUsage database persistence...');
	
	try {
		// Connect to database
		console.log('📦 Connecting to database...');
		await connectToDatabase();
		console.log('✅ Database connected successfully');

		// Test data
		const testUsage = {
			processId: `test-${Date.now()}`,
			operation: TokenOperation.INITIAL_MATCHING,
			estimatedTokens: 1000,
			actualTokens: 950,
			inputTokens: 600,
			outputTokens: 350,
			costEstimate: {
				input: 0.0001,
				output: 0.0002,
				total: 0.0003,
				currency: 'USD',
				isFreeUsage: true,
			},
			userEmail: 'test@example.com',
			companyId: 'test-company-123',
			companyName: 'Test Company',
		};

		console.log('💾 Creating TokenUsage record...');
		console.log('Test data:', JSON.stringify(testUsage, null, 2));

		const result = await TokenUsageService.recordUsage(testUsage);
		
		console.log('✅ TokenUsage record created successfully!');
		console.log('Created record ID:', result._id);
		console.log('Created record:', JSON.stringify(result, null, 2));

		// Verify we can retrieve stats
		console.log('📊 Testing stats retrieval...');
		const userStats = await TokenUsageService.getUserStats('test@example.com');
		console.log('User stats:', JSON.stringify(userStats, null, 2));

		const companyStats = await TokenUsageService.getCompanyStats('test-company-123');
		console.log('Company stats:', JSON.stringify(companyStats, null, 2));

		console.log('🎉 All tests passed! TokenUsage database persistence is working.');

	} catch (error) {
		console.error('❌ TokenUsage database test failed:');
		console.error('Error:', error);
		if (error instanceof Error) {
			console.error('Stack:', error.stack);
		}
		process.exit(1);
	}
}

// Run the test
testTokenUsageDatabase()
	.then(() => {
		console.log('✅ TokenUsage database test completed successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ TokenUsage database test failed:', error);
		process.exit(1);
	});
