'use client';

import React, {useEffect, useState} from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import apiClient from '@/lib/apiClient';
import {Card, CardHeader, CardTitle, CardContent} from '@/components/ui/card';

interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
	context: string;
	data?: Record<string, any> | null;
	sequence: number;
}

interface LogRecord {
	_id: string;
	processId: string;
	context: string;
	startTime: string;
	endTime: string;
	entries: LogEntry[];
}

interface LogsResponse {
	total: number;
	page: number;
	pageSize: number;
	records: LogRecord[];
}
export default function AdminLogsPanel() {
	const [data, setData] = useState<LogsResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const pageSize = 10;

	useEffect(() => {
		setLoading(true);
		setError(null);
		apiClient<LogsResponse>(`/api/admin/logs?page=${page}&pageSize=${pageSize}`)
			.then(res => setData(res))
			.catch(err => setError(err?.message || 'Failed to fetch logs'))
			.finally(() => setLoading(false));
	}, [page]);

	const handleDelete = async () => {
		if (!deleteId) return;
		setDeleteLoading(true);
		setDeleteError(null);
		try {
			await apiClient(`/api/admin/logs/${deleteId}`, {method: 'DELETE'});
			setDeleteId(null);
			// Refresh logs
			setLoading(true);
			apiClient<LogsResponse>(
				`/api/admin/logs?page=${page}&pageSize=${pageSize}`,
			)
				.then(res => setData(res))
				.catch(err => setError(err?.message || 'Failed to fetch logs'))
				.finally(() => setLoading(false));
		} catch (err: any) {
			setDeleteError(err?.message || 'Failed to delete log');
		} finally {
			setDeleteLoading(false);
		}
	};

	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle>Recent System Logs</CardTitle>
			</CardHeader>
			<CardContent>
				{loading && <div>Loading...</div>}
				{error && <div className="text-red-600">{error}</div>}
				{data && (
					<div className="overflow-x-auto">
						<table className="min-w-full border rounded-lg bg-slate-900 text-slate-100 border-slate-700 text-sm">
							<thead className="bg-slate-800 text-slate-200">
								<tr>
									<th className="border border-slate-700 px-2 py-1 text-left">
										Process ID
									</th>
									<th className="border border-slate-700 px-2 py-1 text-left">
										Context
									</th>
									<th className="border border-slate-700 px-2 py-1 text-left">
										Start Time
									</th>
									<th className="border border-slate-700 px-2 py-1 text-left">
										End Time
									</th>
									<th className="border border-slate-700 px-2 py-1 text-left">
										Entries
									</th>
									<th className="border border-slate-700 px-2 py-1 text-left">
										Delete
									</th>
								</tr>
							</thead>
							<tbody>
								{data.records.map(log => (
									<tr key={log._id} className="hover:bg-slate-800">
										<td className="border border-slate-700 px-2 py-1 font-mono text-xs">
											{log.processId}
										</td>
										<td className="border border-slate-700 px-2 py-1">
											{log.context}
										</td>
										<td className="border border-slate-700 px-2 py-1">
											{new Date(log.startTime).toLocaleString()}
										</td>
										<td className="border border-slate-700 px-2 py-1">
											{new Date(log.endTime).toLocaleString()}
										</td>
										<td className="border border-slate-700 px-2 py-1">
											{log.entries.length} entries
											<details className="ml-2">
												<summary className="cursor-pointer text-blue-400 underline hover:text-blue-300 text-xs">
													View
												</summary>
												<ul className="list-disc pl-4">
													{log.entries.slice(0, 5).map((entry, idx) => (
														<li key={idx} className="mb-1">
															<span className="font-mono text-xs text-slate-300">
																[{entry.level}]
															</span>{' '}
															{entry.message}
															<span className="ml-2 text-slate-400 text-xs">
																{new Date(entry.timestamp).toLocaleString()}
															</span>
														</li>
													))}
													{log.entries.length > 5 && (
														<li className="text-xs text-slate-500">
															...and {log.entries.length - 5} more
														</li>
													)}
												</ul>
											</details>
										</td>
										<td className="border border-slate-700 px-2 py-1 text-center">
											<button
												title="Delete log"
												className="text-red-500 hover:text-red-700"
												onClick={() => setDeleteId(log._id)}
												aria-label="Delete log"
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
								className="px-3 py-1 border border-slate-700 rounded bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-50"
								onClick={() => setPage(p => p + 1)}
								disabled={data && page >= Math.ceil(data.total / data.pageSize)}
							>
								Next
							</button>
						</div>
						<ConfirmDeleteModal
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
