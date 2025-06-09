import React from 'react';
import {Button} from '@/components/ui/button';

interface DynamicFieldProps {
	path: string[];
	value: any;
	onUpdate: (path: string[], newValue: any) => void;
	onRemove: (path: string[]) => void;
}

export function DynamicField({
	path,
	value,
	onUpdate,
	onRemove,
}: DynamicFieldProps) {
	const [fieldName, setFieldName] = React.useState(path[path.length - 1]);

	const handleAddField = (type: 'string' | 'object' | 'array') => {
		const newValue = type === 'array' ? [] : type === 'object' ? {} : '';
		if (Array.isArray(value)) {
			onUpdate(path, [...value, newValue]);
		} else if (typeof value === 'object') {
			const key = `field${Object.keys(value).length + 1}`;
			onUpdate(path, {...value, [key]: newValue});
		}
	};

	const handleValueChange = (newValue: any) => {
		onUpdate(path, newValue);
	};

	const handleKeyChange = (oldKey: string, newKey: string) => {
		if (path.length > 0) {
			const parentPath = path.slice(0, -1);
			const parentValue = parentPath.reduce((obj, key) => obj[key], value);
			const newParentValue = {...parentValue};
			delete newParentValue[oldKey];
			newParentValue[newKey] = value[oldKey];
			onUpdate(parentPath, newParentValue);
		}
	};

	const renderField = () => {
		if (Array.isArray(value)) {
			return (
				<div className="pl-4 border-l border-gray-200">
					{value.map((item, index) => (
						<DynamicField
							key={index}
							path={[...path, index.toString()]}
							value={item}
							onUpdate={onUpdate}
							onRemove={onRemove}
						/>
					))}
					<Button
						variant="outline"
						size="sm"
						onClick={() => handleAddField('string')}
						className="mt-2"
					>
						+ Add Item
					</Button>
				</div>
			);
		}

		if (typeof value === 'object' && value !== null) {
			return (
				<div className="pl-4 border-l border-gray-200">
					{Object.entries(value).map(([key, val]) => (
						<DynamicField
							key={key}
							path={[...path, key]}
							value={val}
							onUpdate={onUpdate}
							onRemove={onRemove}
						/>
					))}
					<div className="flex gap-2 mt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAddField('string')}
						>
							+ Add Field
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAddField('object')}
						>
							+ Add Object
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAddField('array')}
						>
							+ Add Array
						</Button>
					</div>
				</div>
			);
		}

		return (
			<div className="flex items-center gap-2 mt-2">
				<input
					type="text"
					value={fieldName}
					onChange={e => setFieldName(e.target.value)}
					onBlur={() => handleKeyChange(path[path.length - 1], fieldName)}
					className="border p-1 rounded w-40"
					placeholder="Field name"
				/>
				<input
					type="text"
					value={value || ''}
					onChange={e => handleValueChange(e.target.value)}
					className="border p-1 rounded flex-1"
					placeholder="Value"
				/>
				<Button variant="outline" size="sm" onClick={() => onRemove(path)}>
					Remove
				</Button>
			</div>
		);
	};

	return renderField();
}
