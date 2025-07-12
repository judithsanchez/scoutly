import {WorkModel} from '@/types/company';

export function getUserEmail(user: any): string | undefined {
	return typeof user === 'object' && user !== null && 'email' in user
		? user.email
		: undefined;
}

export function toWorkModel(val: string | undefined): WorkModel | undefined {
	if (!val) return undefined;
	if (val === 'FULLY_REMOTE') return WorkModel.FULLY_REMOTE;
	if (val === 'HYBRID') return WorkModel.HYBRID;
	if (val === 'IN_OFFICE') return WorkModel.IN_OFFICE;
	return undefined;
}
