'use client';

import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {JobForm} from '@/components/form/JobForm';
import {initializeFormData} from '@/components/form/initializeFormData';

interface Company {
	companyID: string;
	company: string;
}

export default function Home() {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedCompany, setSelectedCompany] = useState<string>('');
	const [savedJobs, setSavedJobs] = useState<any[]>([]);
	const [savedJobsLoading, setSavedJobsLoading] = useState(true);

	// Fetch saved jobs when the component mounts
	useEffect(() => {
		const fetchSavedJobs = async () => {
			setSavedJobsLoading(true);
			const saved = localStorage.getItem('jobFormData');
			if (saved) {
				const formData = JSON.parse(saved);
				if (formData.credentials?.gmail) {
					try {
						const response = await fetch(
							`/api/jobs/saved?gmail=${encodeURIComponent(
								formData.credentials.gmail,
							)}`,
						);
						const data = await response.json();
						setSavedJobs(data.jobs || []);
					} catch (error) {
						console.error('Error fetching saved jobs:', error);
					}
				}
			}
			setSavedJobsLoading(false);
		};

		fetchSavedJobs();
	}, []);

	useEffect(() => {
		const saved = localStorage.getItem('jobFormData');
		if (saved) {
			const formData = JSON.parse(saved);
			if (formData.companyNames?.length > 0) {
				setSelectedCompany(formData.companyNames[0]);
			}
		}
	}, []);

	useEffect(() => {
		const fetchCompanies = async () => {
			try {
				const response = await fetch('/api/companies');
				const data = await response.json();
				setCompanies(data);
			} catch (error) {
				console.error('Failed to fetch companies:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchCompanies();
	}, []);

	if (loading) {
		return (
			<main className="min-h-screen p-8 bg-gradient-to-b from-indigo-950 via-purple-950 to-pink-950">
				<div className="container mx-auto max-w-7xl">
					<div className="flex justify-center items-center h-48">
						<h1 className="text-2xl font-medium text-white/80">
							Loading companies...
						</h1>
					</div>
				</div>
			</main>
		);
	}

	const renderSavedJobs = () => (
		<div className="mt-12 pb-8">
			<h2 className="text-2xl font-bold text-white mb-8 text-center">
				Saved Jobs
			</h2>
			{savedJobsLoading ? (
				<div className="text-center text-white/60">Loading saved jobs...</div>
			) : savedJobs.length === 0 ? (
				<div className="text-center text-white/60">No saved jobs found</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{savedJobs.map((job: any) => (
						<div
							key={job._id}
							className="bg-white/10 p-4 rounded-lg shadow-lg backdrop-blur-sm"
						>
							<h3 className="text-lg font-semibold text-white mb-2">
								{job.jobTitle}
							</h3>
							{job.company && (
								<p className="text-white/80 mb-2">{job.company.company}</p>
							)}
							<div className="flex items-center gap-2 mb-2">
								<span className="text-white/60 text-sm">Status:</span>
								<select
									value={job.status}
									onChange={async e => {
										const saved = localStorage.getItem('jobFormData');
										if (saved) {
											const formData = JSON.parse(saved);
											try {
												const response = await fetch('/api/jobs/saved/status', {
													method: 'PATCH',
													headers: {
														'Content-Type': 'application/json',
													},
													body: JSON.stringify({
														jobId: job._id,
														status: e.target.value,
														gmail: formData.credentials.gmail,
													}),
												});
												if (!response.ok)
													throw new Error('Failed to update status');

												// Refresh saved jobs list
												const savedResponse = await fetch(
													`/api/jobs/saved?gmail=${encodeURIComponent(
														formData.credentials.gmail,
													)}`,
												);
												const data = await savedResponse.json();
												setSavedJobs(data.jobs || []);
											} catch (error) {
												console.error('Error updating job status:', error);
											}
										}
									}}
									className="bg-white/10 text-white border border-white/20 rounded px-2 py-1 text-sm"
								>
									<option value="WANT_TO_APPLY">Want to Apply</option>
									<option value="PENDING_APPLICATION">
										Pending Application
									</option>
									<option value="APPLIED">Applied</option>
									<option value="DISCARDED">Discarded</option>
								</select>
							</div>
							<p className="text-white/60 text-sm">
								Saved on: {new Date(job.createdAt).toLocaleDateString()}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);

	return (
		<main className="min-h-screen p-8 bg-gradient-to-b from-indigo-950 via-purple-950 to-pink-950">
			<div className="container mx-auto max-w-7xl">
				<div className="flex justify-end mb-4">
					<Button
						variant="outline"
						onClick={() => {
							initializeFormData();
							window.location.reload();
						}}
					>
						Load Example Data
					</Button>
				</div>
				<div className="mb-12">
					<JobForm />
				</div>
				<h2 className="text-2xl font-bold text-white mb-8 text-center">
					Available Companies
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{companies.map(company => (
						<Button
							key={company.companyID}
							className="w-full text-lg font-medium"
							onClick={() => {
								const saved = localStorage.getItem('jobFormData');
								if (saved) {
									const formData = JSON.parse(saved);
									const newCompany = company.company;
									formData.companyNames = formData.companyNames || [];
									const index = formData.companyNames.indexOf(newCompany);
									if (index === -1) {
										formData.companyNames.push(newCompany);
									} else {
										formData.companyNames.splice(index, 1);
									}
									localStorage.setItem('jobFormData', JSON.stringify(formData));
									setSelectedCompany(newCompany);
									// Dispatch custom event to notify form
									window.dispatchEvent(new Event('formDataUpdate'));
								}
							}}
							variant={(() => {
								const saved = localStorage.getItem('jobFormData');
								if (saved) {
									const formData = JSON.parse(saved);
									return formData.companyNames?.includes(company.company)
										? 'default'
										: 'outline';
								}
								return 'outline';
							})()}
						>
							{company.company}
						</Button>
					))}
				</div>
				{renderSavedJobs()}
			</div>
		</main>
	);
}
