'use client';

import React, {useState} from 'react';
import {
	ArrayInputProps,
	labelClasses,
	inputClasses,
	secondaryButtonClasses,
	removeButtonClasses,
} from './types';
import {AddIcon, TrashIcon} from './Icons';

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
