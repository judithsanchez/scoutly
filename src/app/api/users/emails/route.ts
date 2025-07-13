import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {logger} from '@/utils/logger';
import {deployment, header, secret} from '@/config/environment';
import {z} from 'zod';

const EmailsResponseSchema = z.object({
	emails: z.array(z.string().email()),
});

export async function GET(req: NextRequest) {
	   if (!deployment.isVercel) {
			   try {
					   await logger.debug('Emails endpoint called');
					   const apiSecret = req.headers.get(header.INTERNAL_API_SECRET);

					   if (!apiSecret || apiSecret !== secret.internalApiSecret) {
							   await logger.error('Unauthorized emails attempt');
							   return NextResponse.json({error: 'Unauthorized'}, {status: 401});
					   }

					   const users = await UserService.getAllUsers();
					   const emails = users.map((u: any) => u.email);

					   const response = EmailsResponseSchema.safeParse({emails});
					   if (!response.success) {
							   await logger.error('Invalid emails response', {
									   issues: response.error.issues,
							   });
							   return NextResponse.json(
									   {error: 'Invalid emails response'},
									   {status: 500},
							   );
					   }

					   await logger.success('Fetched all user emails');
					   return NextResponse.json(response.data);
			   } catch (err) {
					   await logger.error('Emails endpoint server error', err);
					   return NextResponse.json({error: 'Server error'}, {status: 500});
			   }
	   }
	   return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
