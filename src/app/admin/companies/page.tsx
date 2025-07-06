import React from 'react';
import dynamic from 'next/dynamic';

const CompanyAdminPanel = dynamic(
	() => import('@/components/admin/CompanyAdminPanel'),
	{ssr: false},
);

export default function AdminCompaniesPage() {
	return (
		<div className="max-w-4xl mx-auto mt-8">
			<h1 className="text-2xl font-bold mb-6">Manage Companies</h1>
			<CompanyAdminPanel />
		</div>
	);
}
