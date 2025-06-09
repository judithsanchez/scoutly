'use client';

import React from 'react';
import {Button} from '@/components/ui/button';
import {DynamicField} from './DynamicField';

interface FormState {
	credentials: {
		gmail: string;
	};
	companyNames: string[];
	cvUrl: string;
	candidateInfo: Record<string, any>;
	[key: string]: any;
}

const INITIAL_STATE: FormState = {
	credentials: {
		gmail: '',
	},
	companyNames: [],
	cvUrl: '',
	candidateInfo: {},
};

export function JobForm() {
	const [formData, setFormData] = React.useState<FormState>(INITIAL_STATE);

	React.useEffect(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('jobFormData');
			if (saved) {
				setFormData(JSON.parse(saved));
			}
		}
	}, []);

	// Listen for form data updates
	React.useEffect(() => {
		const handleFormUpdate = () => {
			const saved = localStorage.getItem('jobFormData');
			if (saved) {
				setFormData(JSON.parse(saved));
			}
		};

		window.addEventListener('formDataUpdate', handleFormUpdate);
		window.addEventListener('storage', handleFormUpdate);

		return () => {
			window.removeEventListener('formDataUpdate', handleFormUpdate);
			window.removeEventListener('storage', handleFormUpdate);
		};
	}, []);

	const updateFormData = (newData: FormState) => {
		setFormData(newData);
		localStorage.setItem('jobFormData', JSON.stringify(newData));
	};

	const handleUpdateField = (path: string[], value: any) => {
		const newData = {...formData};
		let current: Record<string, any> = newData;

		// Navigate to the parent of the target field
		for (let i = 0; i < path.length - 1; i++) {
			current = current[path[i]] as Record<string, any>;
		}

		// Update the field
		const lastKey = path[path.length - 1];
		current[lastKey] = value;

		updateFormData(newData);
	};

	const handleRemoveField = (path: string[]) => {
		const newData = {...formData};
		let current: Record<string, any> = newData;

		// Navigate to the parent of the target field
		for (let i = 0; i < path.length - 1; i++) {
			current = current[path[i]] as Record<string, any>;
		}

		// Remove the field
		const lastKey = path[path.length - 1];
		if (Array.isArray(current)) {
			current.splice(parseInt(lastKey), 1);
		} else {
			delete current[lastKey];
		}

		updateFormData(newData as FormState);
	};

	return (
		<form className="space-y-6" onSubmit={e => e.preventDefault()}>
			{/* Basic Fields */}
			<div className="space-y-4">
				<div>
					<input
						type="email"
						value={formData.credentials.gmail}
						onChange={e =>
							handleUpdateField(['credentials', 'gmail'], e.target.value)
						}
						className="w-full border p-2 rounded"
						placeholder="Email address"
					/>
				</div>
				<div>
					<input
						type="text"
						value={formData.cvUrl}
						onChange={e => handleUpdateField(['cvUrl'], e.target.value)}
						className="w-full border p-2 rounded"
						placeholder="CV URL"
					/>
				</div>
			</div>

			{/* Dynamic Candidate Info */}
			<div className="space-y-4">
				<h3 className="text-lg font-medium">Candidate Information</h3>
				<DynamicField
					path={['candidateInfo']}
					value={formData.candidateInfo}
					onUpdate={handleUpdateField}
					onRemove={handleRemoveField}
				/>
			</div>

			<div className="pt-4 flex gap-4">
				<Button
					onClick={async () => {
						try {
							const response = await fetch('/api/jobs', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: JSON.stringify(formData),
							});
							const data = await response.json();
							console.log('API Response:', data);
						} catch (error) {
							console.error('Error calling API:', error);
						}
					}}
				>
					Search for Jobs
				</Button>
				<Button
					variant="outline"
					onClick={() =>
						console.log('Form Data:', JSON.stringify(formData, null, 2))
					}
				>
					Log Form Data
				</Button>
			</div>
		</form>
	);
}
