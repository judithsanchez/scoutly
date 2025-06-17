'use client';

import React from 'react';
import {FLEX_BETWEEN, TEXT_PRIMARY, TEXT_SECONDARY} from '@/constants/styles';

/**
 * Card UI component for profile sections
 */
interface CardProps {
	title?: string;
	className?: string;
	children: React.ReactNode;
}

export function ProfileCard({title, className, children}: CardProps) {
	const cardClasses =
		'bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-lg';

	return (
		<div className={`${cardClasses} ${className || ''}`}>
			{title && (
				<h3 className="text-lg font-bold text-[var(--text-color)] mb-4">
					{title}
				</h3>
			)}
			{children}
		</div>
	);
}

/**
 * Header component for profile page
 */
interface HeaderProps {
	title: string;
	description?: string;
}

export function PageHeader({title, description}: HeaderProps) {
	return (
		<div className="mb-8">
			<h1 className="text-3xl font-bold text-[var(--text-color)] mb-2">
				{title}
			</h1>
			{description && <p className="text-[var(--text-muted)]">{description}</p>}
		</div>
	);
}

/**
 * Auth info section component
 */
interface AuthInfoProps {
	email: string;
	onSave: () => void;
	isSaving: boolean;
	saveMessage: string | null;
}

export function AuthInfoSection({
	email,
	onSave,
	isSaving,
	saveMessage,
}: AuthInfoProps) {
	const buttonClasses =
		'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
	const primaryButtonClasses = `${buttonClasses} bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover-bg)] shadow-md`;
	const secondaryButtonClasses = `${buttonClasses} bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)]`;

	return (
		<div className="mb-8 p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
			<div className={FLEX_BETWEEN}>
				<div>
					<h2 className="text-lg font-medium text-[var(--text-color)]">
						Current Session
					</h2>
					<p className="text-purple-400 font-medium mt-1">{email}</p>
				</div>
				<div className="flex gap-3">
					<button
						onClick={onSave}
						disabled={isSaving}
						className={primaryButtonClasses}
					>
						{isSaving ? 'Saving...' : 'Save Profile'}
					</button>
					<a href="/dashboard" className={secondaryButtonClasses}>
						Back to Dashboard
					</a>
				</div>
			</div>
			{saveMessage && (
				<div
					className={`mt-3 p-3 rounded-lg text-sm ${
						saveMessage.includes('successfully')
							? 'bg-green-900/30 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-600 dark:border-green-700'
							: 'bg-red-900/30 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-600 dark:border-red-700'
					}`}
				>
					{saveMessage}
				</div>
			)}
		</div>
	);
}

/**
 * Section heading component
 */
interface SectionHeadingProps {
	title: string;
}

export function SectionHeading({title}: SectionHeadingProps) {
	return (
		<h4 className="font-semibold text-[var(--text-color)] mb-2">{title}</h4>
	);
}

/**
 * Form field input component
 */
interface FormFieldProps {
	id?: string;
	placeholder: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	type?: string;
	required?: boolean;
	label?: string;
}

export function FormField({
	id,
	placeholder,
	value,
	onChange,
	type = 'text',
	required = false,
	label,
}: FormFieldProps) {
	const inputClasses =
		'block w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-purple-500 transition';
	const labelClasses =
		'block text-sm font-medium text-[var(--text-muted)] mb-2';

	return (
		<div>
			{label && (
				<label htmlFor={id} className={labelClasses}>
					{label}
				</label>
			)}
			<input
				id={id}
				type={type}
				value={value}
				onChange={onChange}
				className={inputClasses}
				placeholder={placeholder}
				required={required}
			/>
		</div>
	);
}

/**
 * Save button component
 */
interface SaveButtonProps {
	onClick: () => void;
	disabled: boolean;
	large?: boolean;
}

export function SaveButton({
	onClick,
	disabled,
	large = false,
}: SaveButtonProps) {
	const buttonClasses =
		'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
	const primaryButtonClasses = `${buttonClasses} bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover-bg)] shadow-md`;

	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`${primaryButtonClasses} ${
				large ? 'px-8 py-3 text-base' : ''
			}`}
		>
			{disabled ? 'Saving Profile...' : 'Save Profile'}
		</button>
	);
}

/**
 * Remove button component
 */
interface RemoveButtonProps {
	onClick: () => void;
}

export function RemoveButton({onClick}: RemoveButtonProps) {
	const buttonClasses =
		'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
	const removeButtonClasses = `${buttonClasses} bg-pink-600/80 hover:bg-pink-700 text-white text-xs py-1 px-2 flex items-center justify-center h-10`;

	return (
		<button type="button" onClick={onClick} className={removeButtonClasses}>
			Remove
		</button>
	);
}

/**
 * Add button component
 */
interface AddButtonProps {
	onClick: () => void;
	label: string;
}

export function AddButton({onClick, label}: AddButtonProps) {
	const buttonClasses =
		'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
	const secondaryButtonClasses = `${buttonClasses} bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)] mt-3`;

	return (
		<button type="button" onClick={onClick} className={secondaryButtonClasses}>
			{label}
		</button>
	);
}

/**
 * Checkbox field component
 */
interface CheckboxFieldProps {
	id: string;
	label: string;
	checked: boolean;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CheckboxField({
	id,
	label,
	checked,
	onChange,
}: CheckboxFieldProps) {
	return (
		<div className="flex items-center gap-3 pt-2">
			<label htmlFor={id} className="font-medium text-[var(--text-color)]">
				{label}
			</label>
			<input
				type="checkbox"
				id={id}
				checked={checked}
				onChange={onChange}
				className="h-5 w-5 rounded bg-[var(--input-bg)] border-[var(--input-border)] text-purple-500 focus:ring-purple-500"
			/>
		</div>
	);
}

/**
 * Language item component
 */
interface LanguageProps {
	language: string;
	level: string;
	onLanguageChange: (value: string) => void;
	onLevelChange: (value: string) => void;
	onRemove: () => void;
}

export function LanguageItem({
	language,
	level,
	onLanguageChange,
	onLevelChange,
	onRemove,
}: LanguageProps) {
	const inputClasses =
		'block w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-purple-500 transition';

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-[var(--card-bg-secondary)] rounded-lg items-center">
			<input
				type="text"
				placeholder="Language (e.g., English)"
				value={language}
				onChange={e => onLanguageChange(e.target.value)}
				className={inputClasses}
			/>
			<input
				type="text"
				placeholder="Level (e.g., C1)"
				value={level}
				onChange={e => onLevelChange(e.target.value)}
				className={inputClasses}
			/>
			<RemoveButton onClick={onRemove} />
		</div>
	);
}

/**
 * WorkAuthorization item component
 */
interface WorkAuthorizationProps {
	region: string;
	regionCode: string;
	status: string;
	onRegionChange: (value: string) => void;
	onRegionCodeChange: (value: string) => void;
	onStatusChange: (value: string) => void;
	onRemove: () => void;
}

export function WorkAuthorizationItem({
	region,
	regionCode,
	status,
	onRegionChange,
	onRegionCodeChange,
	onStatusChange,
	onRemove,
}: WorkAuthorizationProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-[var(--card-bg-secondary)] rounded-lg items-center">
			<FormField
				placeholder="Region (e.g., European Union)"
				value={region}
				onChange={e => onRegionChange(e.target.value)}
			/>
			<FormField
				placeholder="Region Code (e.g., EU)"
				value={regionCode}
				onChange={e => onRegionCodeChange(e.target.value)}
			/>
			<FormField
				placeholder="Status (e.g., Citizen)"
				value={status}
				onChange={e => onStatusChange(e.target.value)}
			/>
			<RemoveButton onClick={onRemove} />
		</div>
	);
}
