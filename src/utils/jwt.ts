import {secret} from '@/config';
import jwt from 'jsonwebtoken';

export function signJwt(
	payload: Record<string, any>,
	expiresIn: string = '7d',
) {
	return jwt.sign(payload, secret.jwt as jwt.Secret, {
		expiresIn: expiresIn as any,
	});
}

export function verifyJwt(token: string) {
	try {
		return jwt.verify(token, secret.jwt as jwt.Secret);
	} catch {
		return null;
	}
}
