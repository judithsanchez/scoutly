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
					<div className="flex justify-center items-center h-[80vh]">
						<h1 className="text-2xl font-medium text-white/80">
							Loading companies...
						</h1>
					</div>
				</div>
			</main>
		);
	}

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
			</div>
		</main>
	);
}
