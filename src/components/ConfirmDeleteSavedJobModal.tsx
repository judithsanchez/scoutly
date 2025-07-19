import React from 'react';

interface ConfirmDeleteSavedJobModalProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	loading?: boolean;
}

export default function ConfirmDeleteSavedJobModal({
	open,
	onClose,
	onConfirm,
	loading,
}: ConfirmDeleteSavedJobModalProps) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
				<h2 className="text-lg font-semibold mb-4 text-gray-900">
					Confirm Deletion
				</h2>
				<p className="mb-6 text-gray-700">
					Are you sure you want to delete this saved job? This action cannot be
					undone.
				</p>
				<div className="flex justify-end gap-2">
					<button
						className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
						onClick={onClose}
						disabled={loading}
					>
						Cancel
					</button>
					<button
						className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
						onClick={onConfirm}
						disabled={loading}
					>
						{loading ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</div>
		</div>
	);
}
