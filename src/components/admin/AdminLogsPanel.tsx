'use client';

import React, {useEffect, useState} from 'react';
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
	const pageSize = 10;

	useEffect(() => {
		setLoading(true);
		setError(null);
		apiClient<LogsResponse>(`/api/admin/logs?page=${page}&pageSize=${pageSize}`)
			.then(res => setData(res))
			.catch(err => setError(err?.message || 'Failed to fetch logs'))
			.finally(() => setLoading(false));
	}, [page]);

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
						<table className="min-w-full border rounded-lg bg-white text-sm">
							<thead>
								<tr>
									<th className="border px-2 py-1 text-left">Process ID</th>
									<th className="border px-2 py-1 text-left">Context</th>
									<th className="border px-2 py-1 text-left">Start Time</th>
									<th className="border px-2 py-1 text-left">End Time</th>
									<th className="border px-2 py-1 text-left">Entries</th>
								</tr>
							</thead>
							<tbody>
								{data.records.map(log => (
									<tr key={log._id} className="hover:bg-gray-50">
										<td className="border px-2 py-1 font-mono text-xs">
											{log.processId}
										</td>
										<td className="border px-2 py-1">{log.context}</td>
										<td className="border px-2 py-1">
											{new Date(log.startTime).toLocaleString()}
										</td>
										<td className="border px-2 py-1">
											{new Date(log.endTime).toLocaleString()}
										</td>
										<td className="border px-2 py-1">
											{log.entries.length} entries
											<details className="ml-2">
												<summary className="cursor-pointer text-blue-600 underline text-xs">
													View
												</summary>
												<ul className="list-disc pl-4">
													{log.entries.slice(0, 5).map((entry, idx) => (
														<li key={idx} className="mb-1">
															<span className="font-mono text-xs">
																[{entry.level}]
															</span>{' '}
															{entry.message}
															<span className="ml-2 text-gray-400 text-xs">
																{new Date(entry.timestamp).toLocaleString()}
															</span>
														</li>
													))}
													{log.entries.length > 5 && (
														<li className="text-xs text-gray-500">
															...and {log.entries.length - 5} more
														</li>
													)}
												</ul>
											</details>
										</td>
									</tr>
								))}
							</tbody>
						</table>
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
