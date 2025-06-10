'use client';

import React from 'react';
import {
	FormSectionProps,
	CurrentResidence,
	WorkAuthorization,
	cardClasses,
	inputClasses,
	removeButtonClasses,
	secondaryButtonClasses,
} from './types';

export function LogisticsForm({logistics, setLogistics}: FormSectionProps) {
	const handleResidenceChange = (
		field: keyof CurrentResidence,
		value: string,
	) => {
		setLogistics({
			...logistics,
			currentResidence: {...logistics.currentResidence, [field]: value},
		});
	};

	const handleAuthorizationChange = (
		index: number,
		field: keyof WorkAuthorization,
		value: string,
	) => {
		const updatedAuth = [...logistics.workAuthorization];
		updatedAuth[index] = {...updatedAuth[index], [field]: value};
		setLogistics({...logistics, workAuthorization: updatedAuth});
	};

	const addAuthorization = () => {
		setLogistics({
			...logistics,
			workAuthorization: [
				...logistics.workAuthorization,
				{region: '', regionCode: '', status: ''},
			],
		});
	};

	const removeAuthorization = (index: number) => {
		const filteredAuth = logistics.workAuthorization.filter(
			(_, i) => i !== index,
		);
		setLogistics({...logistics, workAuthorization: filteredAuth});
	};

	return (
		<div className={cardClasses}>
			<h3 className="text-xl font-bold mb-4 text-white">Logistics</h3>
			<div className="space-y-6">
				<div>
					<h4 className="font-semibold text-slate-200 mb-2">
						Current Residence
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<input
							type="text"
							placeholder="City"
							value={logistics.currentResidence.city}
							onChange={e => handleResidenceChange('city', e.target.value)}
							className={inputClasses}
						/>
						<input
							type="text"
							placeholder="Country"
							value={logistics.currentResidence.country}
							onChange={e => handleResidenceChange('country', e.target.value)}
							className={inputClasses}
						/>
						<input
							type="text"
							placeholder="Country Code (e.g., NL)"
							value={logistics.currentResidence.countryCode}
							onChange={e =>
								handleResidenceChange('countryCode', e.target.value)
							}
							className={inputClasses}
						/>
						<input
							type="text"
							placeholder="Timezone (e.g., Europe/Amsterdam)"
							value={logistics.currentResidence.timezone}
							onChange={e => handleResidenceChange('timezone', e.target.value)}
							className={inputClasses}
						/>
					</div>
				</div>
				<div className="flex items-center gap-3 pt-2">
					<label
						htmlFor="willingToRelocate"
						className="font-medium text-slate-200"
					>
						Willing to relocate?
					</label>
					<input
						type="checkbox"
						id="willingToRelocate"
						checked={logistics.willingToRelocate}
						onChange={e =>
							setLogistics({...logistics, willingToRelocate: e.target.checked})
						}
						className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
					/>
				</div>
				<div>
					<h4 className="font-semibold text-slate-200 mb-2">
						Work Authorization
					</h4>
					<div className="space-y-3">
						{logistics.workAuthorization.map((auth, index) => (
							<div
								key={index}
								className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-900/50 rounded-lg items-center"
							>
								<input
									type="text"
									placeholder="Region (e.g., European Union)"
									value={auth.region}
									onChange={e =>
										handleAuthorizationChange(index, 'region', e.target.value)
									}
									className={inputClasses}
								/>
								<input
									type="text"
									placeholder="Region Code (e.g., EU)"
									value={auth.regionCode}
									onChange={e =>
										handleAuthorizationChange(
											index,
											'regionCode',
											e.target.value,
										)
									}
									className={inputClasses}
								/>
								<input
									type="text"
									placeholder="Status (e.g., Citizen)"
									value={auth.status}
									onChange={e =>
										handleAuthorizationChange(index, 'status', e.target.value)
									}
									className={inputClasses}
								/>
								<button
									type="button"
									onClick={() => removeAuthorization(index)}
									className={removeButtonClasses + ' h-10'}
								>
									Remove
								</button>
							</div>
						))}
					</div>
					<button
						type="button"
						onClick={addAuthorization}
						className={secondaryButtonClasses + ' mt-3'}
					>
						Add Authorization
					</button>
				</div>
			</div>
		</div>
	);
}
