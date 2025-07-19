import React from 'react';
import StartScoutButton from '@/components/StartScoutButton';
import styles from '../DashboardPage.module.css';

interface DashboardSessionPanelProps {
	userEmail: string;
	profile: any;
	dashLogger: any;
	searchJobs: (body: any) => Promise<any>;
	handleSearchComplete: (success: boolean, totalJobs: number) => void;
	setSearchComplete: (value: any) => void;
}

const DashboardSessionPanel: React.FC<DashboardSessionPanelProps> = ({
	userEmail,
	profile,
	dashLogger,
	searchJobs,
	handleSearchComplete,
	setSearchComplete,
}) => {
	return (
		<div className={styles.cardContainer}>
			<div className={styles.flexBetween}>
				<div>
					<h2 className={styles.sessionHeading}>Current Session</h2>
					<p className={styles.sessionEmail}>{userEmail}</p>
				</div>
				<div className={styles.buttonGroup}>
					<a href="/profile" className={styles.cardLink}>
						Edit Profile
					</a>
					<StartScoutButton
						onScoutStart={async selectedCompanyIds => {
							dashLogger?.info('User Action: Started job search', {
								selectedCompanies: selectedCompanyIds,
							});
							setSearchComplete(null);
							try {
								if (!profile) {
									throw new Error('User profile not loaded. Please try again.');
								}
								const candidateInfo = profile.candidateInfo || {};
								const cvUrl = profile.cvUrl || null;
								if (!cvUrl) {
									throw new Error(
										'Please complete your profile first. Missing: CV/Resume URL. Visit your profile page to add this information.',
									);
								}
								const requestBody = {
									credentials: {gmail: ''},
									companyIds: selectedCompanyIds,
									cvUrl,
									candidateInfo,
								};
								dashLogger?.info('Sending job search request', {
									companyCount: selectedCompanyIds.length,
									companies: selectedCompanyIds,
								});
								dashLogger?.info('API Request: POST /api/jobs', requestBody);
								let searchData;
								try {
									searchData = await searchJobs(requestBody);
								} catch (err: any) {
									dashLogger?.error('Job search request failed', {
										error: err,
										requestBody: {
											...requestBody,
											cvUrl: cvUrl ? '[PRESENT]' : '[MISSING]',
											candidateInfo: candidateInfo ? '[PRESENT]' : '[MISSING]',
										},
									});
									let errorMessage =
										err?.message ||
										'An error occurred while searching for jobs';
									throw new Error(errorMessage);
								}
								dashLogger?.info('Job search completed successfully', {
									searchData,
								});
								const totalJobs = searchData.results.reduce(
									(acc: number, company: any) => {
										return (
											acc + (company.processed ? company.results.length : 0)
										);
									},
									0,
								);
								dashLogger?.info('Job search results processed', {
									totalJobs,
									processedCompanies: searchData.results.filter(
										(r: any) => r.processed,
									).length,
									totalCompanies: searchData.results.length,
								});
								handleSearchComplete(true, totalJobs);
							} catch (err: any) {
								const catchErrorMessage =
									err?.message ||
									'An unexpected error occurred while searching for jobs';
								dashLogger?.error('Job search failed', {
									error: catchErrorMessage,
									stack: err?.stack,
									selectedCompanies: selectedCompanyIds,
								});
								dashLogger?.error('Failed to start scout', {error: err});
								const errorMessage =
									err?.message ||
									'An unexpected error occurred while searching for jobs';
								dashLogger?.error('Detailed scout error info', {
									message: errorMessage,
									stack: err?.stack,
									timestamp: new Date().toISOString(),
								});
								handleSearchComplete(false, 0);
							}
						}}
						className={styles.ml2}
					/>
				</div>
			</div>
		</div>
	);
};

export default DashboardSessionPanel;
