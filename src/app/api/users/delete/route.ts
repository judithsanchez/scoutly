import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {UserCredential} from '@/models/UserCredential';
import {logger} from '@/utils/logger';
import {deployment, header, secret} from '@/config/environment';
import {z} from 'zod';

const DeleteUserSchema = z.object({
	email: z.string().email(),
});

export async function DELETE(req: NextRequest) {
	if (!deployment.isVercel) {
		try {
			await logger.debug('Delete user endpoint called');
			const apiSecret = req.headers.get(header.INTERNAL_API_SECRET.toLowerCase();

			if (!apiSecret || apiSecret !== secret.internalApiSecret) {
				await logger.error('Unauthorized delete-user attempt');
				return NextResponse.json({error: 'Unauthorized'}, {status: 401});
			}

			const body = await req.json();
			const parseResult = DeleteUserSchema.safeParse(body);

			if (!parseResult.success) {
				await logger.warn('Invalid delete-user payload', {
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
				await logger.info('User not found for delete', {email});
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}
			await UserCredential.deleteOne({email});
			await user.deleteOne();

			await logger.success('User deleted', {email});
			return NextResponse.json({success: true});
		} catch (err) {
			await logger.error('Delete-user endpoint server error', err);
			return NextResponse.json({error: 'Server error'}, {status: 500});
		}
	}
}
