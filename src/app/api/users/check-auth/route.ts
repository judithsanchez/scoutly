import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';

const AUTHORIZED_EMAIL = 'judithv.sanchezc@gmail.com';

export async function GET() {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({isAuthorized: false});
		}

		return NextResponse.json({
			isAuthorized:
				session.user.email.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase(),
		});
	} catch (error) {
		return NextResponse.json(
			{error: 'Failed to check authorization'},
			{status: 500},
		);
	}
}
