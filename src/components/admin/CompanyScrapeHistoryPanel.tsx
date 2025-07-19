'use client';

import React, {useEffect, useState} from 'react';
import apiClient from '@/lib/apiClient';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';

interface ScrapeHistoryRecord {
	_id: string;
	companyID: string;
	company: string;
	lastScrapeDate: string;
	status: string;
	error?: string;
}

interface ScrapeHistoryResponse {
	total: number;
	page: number;
	pageSize: number;
	records: ScrapeHistoryRecord[];
}

export default function CompanyScrapeHistoryPanel() {
	const [data, setData] = useState<ScrapeHistoryResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const pageSize = 20;

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const json = await apiClient<ScrapeHistoryResponse>(
					`/api/admin/company-scrape-history?page=${page}&pageSize=${pageSize}`,
				);
				setData(json);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [page]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Company Scrape History</CardTitle>
			</CardHeader>
			<CardContent>
				{loading && <div>Loading...</div>}
				{error && <div className="text-red-600">{error}</div>}
				{data && (
					<div className="overflow-x-auto">
						<table className="min-w-full border rounded-lg bg-white">
							<thead>
								<tr>
									<th className="border px-3 py-2 text-left">Company</th>
									<th className="border px-3 py-2 text-left">Company ID</th>
									<th className="border px-3 py-2 text-left">Last Scrape</th>
									<th className="border px-3 py-2 text-left">Status</th>
									<th className="border px-3 py-2 text-left">Error</th>
								</tr>
							</thead>
							<tbody>
								{data.records.map(r => (
									<tr key={r._id} className="hover:bg-gray-50">
										<td className="border px-3 py-2">{r.company}</td>
										<td className="border px-3 py-2">{r.companyID}</td>
										<td className="border px-3 py-2">
											{r.lastScrapeDate
												? new Date(r.lastScrapeDate).toLocaleString()
												: '-'}
										</td>
										<td className="border px-3 py-2">{r.status}</td>
										<td className="border px-3 py-2">{r.error || '-'}</td>
									</tr>
								))}
							</tbody>
						</table>
						{/* Pagination */}
						<div className="flex justify-between items-center mt-4">
							<button
								className="px-3 py-1 border rounded disabled:opacity-50"
								onClick={() => setPage(p => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</button>
							<span>
								Page {page} of{' '}
								{data ? Math.ceil(data.total / data.pageSize) : 1}
							</span>
							<button
								className="px-3 py-1 border rounded disabled:opacity-50"
								onClick={() => setPage(p => p + 1)}
								disabled={data && page >= Math.ceil(data.total / data.pageSize)}
							>
								Next
							</button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
