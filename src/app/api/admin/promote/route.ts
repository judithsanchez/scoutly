import {NextResponse} from 'next/server';
import connectToDB from '@/lib/db';
import {AdminUser} from '@/models/AdminUser';
import {User} from '@/models/User';

export async function POST(req: Request) {
	const secret = req.headers.get('X-Internal-API-Secret');
	if (secret !== process.env.INTERNAL_API_SECRET) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401});
	}

	const {email} = await req.json();
	if (!email) {
		return NextResponse.json({error: 'Missing email'}, {status: 400});
	}

	await connectToDB();

	const user = await User.findOne({email: email.toLowerCase()});
	if (!user) {
		return NextResponse.json({error: 'User not found'}, {status: 404});
	}

	const alreadyAdmin = await AdminUser.findOne({email: email.toLowerCase()});
	if (alreadyAdmin) {
		return NextResponse.json({message: 'User is already an admin'});
	}

	await AdminUser.create({
		email: email.toLowerCase(),
		createdBy: 'judithv.sanchezc@gmail.com',
	});

	return NextResponse.json({message: `User ${email} promoted to admin.`});
}
