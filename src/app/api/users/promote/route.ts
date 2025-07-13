import {NextRequest, NextResponse} from 'next/server';
import {AdminUserService} from '@/services/adminUserService';
import {logger} from '@/utils/logger';
import {deployment, header, secret} from '@/config/environment';
import {z} from 'zod';

const PromoteSchema = z.object({
	email: z.string().email(),
	createdBy: z.string().email(),
	role: z.enum(['admin', 'super_admin', 'moderator']).optional(),
});

export async function POST(req: NextRequest) {
	if (!deployment.isVercel) {
		try {
			await logger.debug('Promote endpoint called');
			const apiSecret =
  req.headers.get(header.INTERNAL_API_SECRET) ||
  req.headers.get(header.INTERNAL_API_SECRET.toLowerCase());

			if (!apiSecret || apiSecret !== secret.internalApiSecret) {
				await logger.error('Unauthorized promote attempt');
				return NextResponse.json({error: 'Unauthorized'}, {status: 401});
			}

			const body = await req.json();
			const parseResult = PromoteSchema.safeParse(body);

			if (!parseResult.success) {
				await logger.warn('Invalid promote payload', {
					issues: parseResult.error.issues,
				});
				return NextResponse.json(
					{error: 'Invalid payload', details: parseResult.error.issues},
					{status: 400},
				);
			}

			const {email, createdBy, role} = parseResult.data;
			const admin = await AdminUserService.promote(
				email,
				createdBy,
				role || 'admin',
			);
			await logger.success('User promoted to admin', {
				email,
				role: role || 'admin',
			});
			return NextResponse.json({admin});
		} catch (err) {
			await logger.error('Promote endpoint server error', err);
			return NextResponse.json({error: 'Server error'}, {status: 500});
		}
	}
}
