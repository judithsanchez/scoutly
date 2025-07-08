// Internal API endpoint for fetching user profile by email (no session required)
import {NextResponse} from 'next/server';
// import {User} from '@/models/User';
// import connectToDB from '@/lib/db';

export const POST = async (req: Request) => {
  const secret = req.headers.get('x-internal-api-secret');
  if (secret !== process.env.INTERNAL_API_SECRET) {
	return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
	// Proxy the request to the backend API
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
	const backendUrl = `${apiUrl.replace(/\/$/, '')}/internal/user/profile`;

	const { email } = await req.json();
	if (!email) {
	  return NextResponse.json({ error: 'Email required' }, { status: 400 });
	}

	const backendRes = await fetch(backendUrl, {
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json',
		'x-internal-api-secret': secret || '',
	  },
	  body: JSON.stringify({ email }),
	});

	const data = await backendRes.json();

	if (!backendRes.ok) {
	  return NextResponse.json({ error: data.error || 'Backend error' }, { status: backendRes.status });
	}

	return NextResponse.json(data);
  } catch (error: any) {
	return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
};
