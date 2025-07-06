'use client';

import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';

interface Company {
	_id: string;
	companyID: string;
	company: string;
	careers_url?: string;
	work_model?: string;
	headquarters?: string;
	office_locations?: string[];
	fields?: string[];
}

async function fetchCompanies(): Promise<Company[]> {
	const res = await fetch('/api/companies');
	if (!res.ok) throw new Error('Failed to fetch companies');
	return res.json();
}

async function deleteCompany(companyId: string) {
	const res = await fetch(`/api/companies/${companyId}`, {
		method: 'DELETE',
	});
	if (!res.ok) {
		const err = await res.json();
		throw new Error(err.error || 'Failed to delete company');
	}
	return res.json();
}

export default function CompanyAdminPanel() {
	const queryClient = useQueryClient();
	const [error, setError] = useState<string | null>(null);

	const {data: companies, isLoading} = useQuery<Company[]>({
		queryKey: ['admin-companies'],
		queryFn: fetchCompanies,
	});

	const deleteMutation = useMutation({
		mutationFn: deleteCompany,
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['admin-companies']});
			setError(null);
		},
		onError: (err: any) => {
			setError(err.message || 'Failed to delete company');
		},
	});

	return (
		<div className="p-4 border rounded bg-white shadow">
			<h2 className="text-xl font-bold mb-4">Company Admin Panel</h2>
			{error && (
				<div className="mb-2 p-2 bg-red-100 text-red-700 rounded">{error}</div>
			)}
			{isLoading ? (
				<div>Loading companies...</div>
			) : (
				<table className="min-w-full border">
					<thead>
						<tr>
							<th className="border px-2 py-1">Company</th>
							<th className="border px-2 py-1">ID</th>
							<th className="border px-2 py-1">Work Model</th>
							<th className="border px-2 py-1">Actions</th>
						</tr>
					</thead>
					<tbody>
						{companies?.map(c => (
							<tr key={c._id}>
								<td className="border px-2 py-1">{c.company}</td>
								<td className="border px-2 py-1">{c.companyID}</td>
								<td className="border px-2 py-1">{c.work_model}</td>
								<td className="border px-2 py-1">
									<button
										className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
										onClick={() => {
											if (
												window.confirm(
													`Are you sure you want to delete "${c.company}"?`,
												)
											) {
												deleteMutation.mutate(c.companyID);
											}
										}}
									>
										Delete
									</button>
									{/* You can add an Edit button here */}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
