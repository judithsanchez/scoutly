import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {UserService} from '@/services/userService';
import AdminUser from '@/models/AdminUser';
import {z} from 'zod';
import {ErrorResponseSchema} from '@/schemas/userSchemas';

const PromoteUserSchema = z.object({
	email: z.string().email(),
	role: z.enum(['super_admin', 'admin', 'moderator']).optional(),
});

const REQUIRED_SECRET = process.env.INTERNAL_API_SECRET || 'changeme';

export async function PATCH(request: NextRequest) {
	try {
		// Check internal API secret
		const secret = request.headers.get('x-internal-api-secret');
		if (!secret || secret !== REQUIRED_SECRET) {
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'Missing or invalid X-Internal-API-Secret header',
				}),
				{status: 401},
			);
		}

		await dbConnect();
		const body = await request.json();
		const parseResult = PromoteUserSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'Invalid request body',
					details: parseResult.error.errors,
				}),
				{status: 400},
			);
		}

		const {email, role} = parseResult.data;

		// Check if user exists in main User collection
		const user = await UserService.getUserByEmail(email);
		if (!user) {
			return NextResponse.json(
				ErrorResponseSchema.parse({error: 'User not found'}),
				{status: 404},
			);
		}

		// Check if already admin
		const existingAdmin = await AdminUser.findOne({email: email.toLowerCase()});
		if (existingAdmin) {
			return NextResponse.json(
				ErrorResponseSchema.parse({error: 'User is already an admin'}),
				{status: 400},
			);
		}

		// Create new admin user
		const newAdmin = new AdminUser({
			email: email.toLowerCase(),
			role: role || 'admin',
			createdBy: 'api',
			permissions: [],
			isActive: true,
		});

		await newAdmin.save();

		// Return the new admin user (omit sensitive fields)
		return NextResponse.json({
			email: newAdmin.email,
			role: newAdmin.role,
			createdBy: newAdmin.createdBy,
			isActive: newAdmin.isActive,
			permissions: newAdmin.permissions,
			createdAt: newAdmin.createdAt,
			updatedAt: newAdmin.updatedAt,
		});
	} catch (error: any) {
		return NextResponse.json(
			ErrorResponseSchema.parse({
				error: error.message || 'Internal server error',
			}),
			{status: 500},
		);
	}
}
