import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {logger} from '@/utils/logger';
import {deployment, header, secret} from '@/config/environment';
import {z} from 'zod';

const UserIdByEmailSchema = z.object({
	email: z.string().email(),
});

export async function POST(req: NextRequest) {
	if (!deployment.isVercel) {
		try {
			await logger.debug('UserId-by-email endpoint called');
			const apiSecret =
  req.headers.get(header.INTERNAL_API_SECRET) ||
  req.headers.get(header.INTERNAL_API_SECRET.toLowerCase());

			if (!apiSecret || apiSecret !== secret.internalApiSecret) {
				await logger.error('Unauthorized userId-by-email attempt');
				return NextResponse.json({error: 'Unauthorized'}, {status: 401});
			}

			const body = await req.json();
			const parseResult = UserIdByEmailSchema.safeParse(body);

			if (!parseResult.success) {
				await logger.warn('Invalid userId-by-email payload', {
					issues: parseResult.error.issues,
				});
				return NextResponse.json(
					{error: 'Invalid payload', details: parseResult.error.issues},
					{status: 400},
				);
			}

			const {email} = parseResult.data;
			const user = await UserService.getUserByEmail(email);
			if (!user) {
				await logger.info('User not found for userId-by-email', {email});
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}
			await logger.success('UserId returned for email', {
				email,
				userId: user.userId,
			});
			return NextResponse.json({userId: user.userId});
		} catch (err) {
			await logger.error('UserId-by-email endpoint server error', err);
			return NextResponse.json({error: 'Server error'}, {status: 500});
		}
	}
}
