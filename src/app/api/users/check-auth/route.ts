import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
	try {
		const {email} = await req.json();
		const validEmail = 'judithv.sanchezc@gmail.com';

		if (email === validEmail) {
			// In a real app, we'd verify against a database and handle proper auth
			// For now, just accept our test email
			return NextResponse.json(
				{isAuthorized: true},
				{
					status: 200,
					headers: {
						'Set-Cookie': `auth=${email}; Path=/; HttpOnly; SameSite=Strict`,
					},
				},
			);
		}

		return NextResponse.json(
			{isAuthorized: false, message: 'Invalid email'},
			{status: 401},
		);
	} catch (error) {
		console.error('Auth check error:', error);
		return NextResponse.json(
			{isAuthorized: false, message: 'Server error'},
			{status: 500},
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		const authCookie = req.cookies.get('auth');
		const validEmail = 'judithv.sanchezc@gmail.com';

		if (authCookie?.value === validEmail) {
			return NextResponse.json({isAuthorized: true});
		}

		return NextResponse.json({isAuthorized: false}, {status: 401});
	} catch (error) {
		console.error('Auth check error:', error);
		return NextResponse.json({isAuthorized: false}, {status: 500});
	}
}
