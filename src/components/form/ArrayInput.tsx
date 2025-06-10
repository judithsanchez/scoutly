'use client';

import React, {useState} from 'react';

interface ArrayInputProps {
	label: string;
	items: string[];
	setItems: (items: string[]) => void;
	placeholder?: string;
}

const labelClasses = 'block text-sm font-medium text-slate-300 mb-2';
const inputClasses =
	'block w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition';
const buttonClasses =
	'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButtonClasses = `${buttonClasses} bg-slate-600 hover:bg-slate-500 text-white`;
const removeButtonClasses = `${buttonClasses} bg-pink-600/80 hover:bg-pink-700 text-white text-xs py-1 px-2 flex items-center justify-center`;

// Icons
const AddIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="12" y1="5" x2="12" y2="19"></line>
		<line x1="5" y1="12" x2="19" y2="12"></line>
	</svg>
);

const TrashIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<polyline points="3 6 5 6 21 6"></polyline>
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
		<line x1="10" y1="11" x2="10" y2="17"></line>
		<line x1="14" y1="11" x2="14" y2="17"></line>
	</svg>
);

export function ArrayInput({
	label,
	items,
	setItems,
	placeholder = '',
}: ArrayInputProps) {
	const [newItem, setNewItem] = useState('');

	const handleAddItem = () => {
		if (newItem.trim() !== '') {
			setItems([...items, newItem.trim()]);
			setNewItem('');
		}
	};

	const handleRemoveItem = (indexToRemove: number) => {
		setItems(items.filter((_, index) => index !== indexToRemove));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAddItem();
		}
	};

	return (
		<div>
			<label className={labelClasses}>{label}</label>
			<div className="space-y-2">
				{items.map((item, index) => (
					<div
						key={index}
						className="flex items-center gap-2 bg-slate-700/30 p-2 rounded-lg"
					>
						<span className="flex-grow text-slate-200 break-all">{item}</span>
						<button
							type="button"
							onClick={() => handleRemoveItem(index)}
							className={removeButtonClasses}
						>
							<TrashIcon />
						</button>
					</div>
				))}
			</div>
			<div className="flex gap-2 mt-2">
				<input
					type="text"
					value={newItem}
					onChange={e => setNewItem(e.target.value)}
					onKeyDown={handleKeyDown}
					className={inputClasses}
					placeholder={placeholder}
				/>
				<button
					type="button"
					onClick={handleAddItem}
					className={secondaryButtonClasses}
					disabled={!newItem.trim()}
				>
					<AddIcon />
				</button>
			</div>
		</div>
	);
}
