'use client';

import React, {useEffect, useState} from 'react';
import ConfirmDeleteScrapeHistoryModal from './ConfirmDeleteScrapeHistoryModal';
import apiClient from '@/lib/apiClient';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';

interface ScrapeHistoryLink {
	url: string;
	text: string;
	context?: string;
}

interface ScrapeHistoryRecord {
	_id: string;
	companyId: string;
	userEmail?: string;
	createdAt: string;
	lastScrapeDate: string;
	links?: ScrapeHistoryLink[];
	status?: string;
	error?: string;
	updatedAt?: string;
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
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const pageSize = 20;

	useEffect(() => {
		setLoading(true);
		setError(null);
		apiClient<ScrapeHistoryResponse>(
			`/api/admin/company-scrape-history?page=${page}&pageSize=${pageSize}`,
		)
			.then(res => setData(res))
			.catch(err => setError(err?.message || 'Failed to fetch'))
			.finally(() => setLoading(false));
	}, [page]);

	const handleDelete = async () => {
		if (!deleteId) return;
		setDeleteLoading(true);
		setDeleteError(null);
		try {
			await apiClient(`/api/admin/company-scrape-history/${deleteId}`, {
				method: 'DELETE',
			});
			setDeleteId(null);
			setLoading(true);
			apiClient<ScrapeHistoryResponse>(
				`/api/admin/company-scrape-history?page=${page}&pageSize=${pageSize}`,
			)
				.then(res => setData(res))
				.catch(err => setError(err?.message || 'Failed to fetch'))
				.finally(() => setLoading(false));
		} catch (err: any) {
			setDeleteError(err?.message || 'Failed to delete scrape history');
		} finally {
			setDeleteLoading(false);
		}
	};

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
						<table className="min-w-full border rounded-lg bg-slate-900 text-slate-100 border-slate-700">
							<thead className="bg-slate-800 text-slate-200">
								<tr>
									<th className="border border-slate-700 px-3 py-2 text-left">
										Company ID
									</th>
									<th className="border border-slate-700 px-3 py-2 text-left">
										User Email
									</th>
									<th className="border border-slate-700 px-3 py-2 text-left">
										Created At
									</th>
									<th className="border border-slate-700 px-3 py-2 text-left">
										Last Scrape
									</th>
									<th className="border border-slate-700 px-3 py-2 text-left">
										Links
									</th>
									<th className="border border-slate-700 px-3 py-2 text-left">
										Status
									</th>
									<th className="border border-slate-700 px-3 py-2 text-left">
										Error
									</th>
									<th className="border border-slate-700 px-3 py-2 text-left">
										Delete
									</th>
								</tr>
							</thead>
							<tbody>
								{data.records.map(r => (
									<tr key={r._id} className="hover:bg-slate-800">
										<td className="border border-slate-700 px-3 py-2">
											{r.companyId}
										</td>
										<td className="border border-slate-700 px-3 py-2">
											{r.userEmail || ''}
										</td>
										<td className="border border-slate-700 px-3 py-2">
											{r.createdAt
												? new Date(r.createdAt).toLocaleString()
												: ''}
										</td>
										<td className="border border-slate-700 px-3 py-2">
											{r.lastScrapeDate
												? new Date(r.lastScrapeDate).toLocaleString()
												: ''}
										</td>
										<td className="border border-slate-700 px-3 py-2">
											{r.links && r.links.length > 0 ? (
												<ul className="list-disc pl-4">
													{r.links.map((link, idx) => (
														<li key={idx}>
															<a
																href={link.url}
																target="_blank"
																rel="noopener noreferrer"
																className="text-blue-400 underline hover:text-blue-300"
															>
																{link.text || link.url}
															</a>
															{link.context && (
																<span className="ml-2 text-xs text-slate-400">
																	({link.context})
																</span>
															)}
														</li>
													))}
												</ul>
											) : (
												<span className="text-slate-500">No links</span>
											)}
										</td>
										<td className="border border-slate-700 px-3 py-2">
											{r.status || ''}
										</td>
										<td className="border border-slate-700 px-3 py-2 text-xs text-red-500">
											{r.error || ''}
										</td>
										<td className="border border-slate-700 px-3 py-2 text-center">
											<button
												title="Delete scrape history"
												className="text-red-500 hover:text-red-700"
												onClick={() => setDeleteId(r._id)}
												aria-label="Delete scrape history"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5 inline"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
													/>
												</svg>
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<div className="flex justify-between items-center mt-4">
							<button
								className="px-3 py-1 border border-slate-700 rounded bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-50"
								onClick={() => setPage((p: number) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</button>
							<span>
								Page {page} of{' '}
								{data ? Math.ceil(data.total / data.pageSize) : 1}
							</span>
							<button
								className="px-3 py-1 border border-slate-700 rounded bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-50"
								onClick={() => setPage((p: number) => p + 1)}
								disabled={data && page >= Math.ceil(data.total / data.pageSize)}
							>
								Next
							</button>
						</div>
						<ConfirmDeleteScrapeHistoryModal
							open={!!deleteId}
							onClose={() => {
								setDeleteId(null);
								setDeleteError(null);
							}}
							onConfirm={handleDelete}
							loading={deleteLoading}
						/>
						{deleteError && (
							<div className="text-red-600 mt-2">{deleteError}</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
