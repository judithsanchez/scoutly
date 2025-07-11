process.env.INTERNAL_API_SECRET = 'testsecret';
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import * as userServiceModule from '@/services/userService';
import {POST} from './handler';

describe('/internal/verify-user API', () => {
	const INTERNAL_SECRET = 'testsecret';
	let userServiceSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		userServiceSpy = vi.spyOn(
			userServiceModule.UserService as any,
			'getUserByEmail',
		);
	});
	afterEach(() => {
		vi.resetAllMocks();
	});

	function makeRequest({email, secret}: {email?: string; secret?: string}) {
		return {
			headers: {
				get: (key: string) =>
					key === 'x-internal-secret' ? secret : undefined,
			},
			json: async () => (email !== undefined ? {email} : {}),
		} as unknown as Request;
	}

	it('should return 403 if x-internal-secret is missing', async () => {
		const req = makeRequest({email: 'test@example.com'});
		const res = await POST(req);
		expect(res.status).toBe(403);
	});

	it('should return 400 if email is missing in the request body', async () => {
		const req = makeRequest({secret: INTERNAL_SECRET});
		const res = await POST(req);
		expect(res.status).toBe(400);
	});

	it('should return { exists: true } for a pre-approved user', async () => {
		userServiceSpy.mockResolvedValueOnce({
			_id: '123',
			email: 'test@example.com',
		});
		const req = makeRequest({
			email: 'test@example.com',
			secret: INTERNAL_SECRET,
		});
		const res = await POST(req);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data).toEqual({exists: true});
	});

	it('should return { exists: false } for a non-existent user', async () => {
		userServiceSpy.mockResolvedValueOnce(null);
		const req = makeRequest({
			email: 'notfound@example.com',
			secret: INTERNAL_SECRET,
		});
		const res = await POST(req);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data).toEqual({exists: false});
	});

	it('should handle database errors gracefully and return 500', async () => {
		userServiceSpy.mockRejectedValueOnce(new Error('DB error'));
		const req = makeRequest({
			email: 'test@example.com',
			secret: INTERNAL_SECRET,
		});
		const res = await POST(req);
		expect(res.status).toBe(500);
		const data = await res.json();
		expect(data).toHaveProperty('message');
	});
});
