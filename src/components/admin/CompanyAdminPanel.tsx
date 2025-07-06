'use client';

import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Trash2} from 'lucide-react';

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
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Trash2 className="h-5 w-5 text-red-500" />
					Company Management
				</CardTitle>
				<CardDescription>
					View and remove companies from the database. Deletion is permanent.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{error && (
					<div className="mb-2 p-2 bg-red-100 text-red-700 rounded">
						{error}
					</div>
				)}
				{isLoading ? (
					<div>Loading companies...</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full border rounded-lg bg-white">
							<thead>
								<tr>
									<th className="border px-3 py-2 text-left">Company</th>
									<th className="border px-3 py-2 text-left">ID</th>
									<th className="border px-3 py-2 text-left">Work Model</th>
									<th className="border px-3 py-2 text-left">Actions</th>
								</tr>
							</thead>
							<tbody>
								{companies?.map(c => (
									<tr key={c._id} className="hover:bg-gray-50">
										<td className="border px-3 py-2">{c.company}</td>
										<td className="border px-3 py-2">{c.companyID}</td>
										<td className="border px-3 py-2">{c.work_model}</td>
										<td className="border px-3 py-2">
											<Button
												variant="outline"
												size="sm"
												className="text-red-600 border-red-300 hover:bg-red-50"
												onClick={() => {
													if (
														window.confirm(
															`Are you sure you want to delete "${c.company}"? This cannot be undone.`,
														)
													) {
														deleteMutation.mutate(c.companyID);
													}
												}}
											>
												<Trash2 className="h-4 w-4 mr-1" />
												Delete
											</Button>
											{/* You can add an Edit button here */}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{companies?.length === 0 && (
							<div className="text-center py-8 text-gray-500">
								No companies found.
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
