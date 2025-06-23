'use client';

import {useState, useEffect, useCallback} from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Switch} from '@/components/ui/switch';
import {
	Trash2,
	UserPlus,
	Shield,
	User,
	CheckCircle,
	XCircle,
} from 'lucide-react';
import {useSession} from 'next-auth/react';

interface User {
	_id: string;
	email: string;
	isAdmin: boolean;
	hasCompleteProfile: boolean;
	createdAt: string;
	updatedAt: string;
}

interface UsersResponse {
	success: boolean;
	users: User[];
	total: number;
	message?: string;
}

interface CreateUserResponse {
	success: boolean;
	message: string;
	user?: {
		_id: string;
		email: string;
		isAdmin: boolean;
		createdAt: string;
	};
}

export default function UserManagement() {
	const {data: session} = useSession();
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);

	// Form state
	const [newUserEmail, setNewUserEmail] = useState('');
	const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const fetchUsers = useCallback(async () => {
		try {
			const response = await fetch('/api/admin/users', {
				headers: {
					'x-admin-email': session?.user?.email || '',
				},
			});

			const data: UsersResponse = await response.json();

			if (data.success) {
				setUsers(data.users);
				setError(null);
			} else {
				setError(data.message || 'Failed to fetch users');
			}
		} catch (err) {
			setError('Network error while fetching users');
			console.error('Error fetching users:', err);
		} finally {
			setLoading(false);
		}
	}, [session?.user?.email]);

	const createUser = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setFormError(null);
		setIsCreating(true);

		if (!newUserEmail || !newUserEmail.includes('@')) {
			setFormError('Please enter a valid email address');
			setIsCreating(false);
			return;
		}

		try {
			const response = await fetch('/api/admin/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-admin-email': session?.user?.email || '',
				},
				body: JSON.stringify({
					email: newUserEmail,
					isAdmin: newUserIsAdmin,
				}),
			});

			const data: CreateUserResponse = await response.json();

			if (data.success) {
				setNewUserEmail('');
				setNewUserIsAdmin(false);
				fetchUsers(); // Refresh the list
			} else {
				setFormError(data.message || 'Failed to create user');
			}
		} catch (err) {
			setFormError('Network error while creating user');
			console.error('Error creating user:', err);
		} finally {
			setIsCreating(false);
		}
	};

	const toggleUserAdmin = async (
		email: string,
		currentAdminStatus: boolean,
	) => {
		try {
			const response = await fetch(`/api/admin/users`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'x-admin-email': session?.user?.email || '',
				},
				body: JSON.stringify({
					email,
					isAdmin: !currentAdminStatus,
				}),
			});

			const data = await response.json();

			if (data.success) {
				fetchUsers(); // Refresh the list
			} else {
				setError(data.message || 'Failed to update user');
			}
		} catch (err) {
			setError('Network error while updating user');
			console.error('Error updating user:', err);
		}
	};

	useEffect(() => {
		if (session?.user?.email) {
			fetchUsers();
		}
	}, [session, fetchUsers]);

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>User Management</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-4">Loading users...</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Create User Form */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserPlus className="h-5 w-5" />
						Add New User
					</CardTitle>
					<CardDescription>
						Add a new user to the system. Users must be pre-approved before they
						can sign in.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={createUser} className="space-y-4">
						{formError && (
							<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
								{formError}
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									type="email"
									value={newUserEmail}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setNewUserEmail(e.target.value)
									}
									placeholder="user@example.com"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="admin">Admin Privileges</Label>
								<div className="flex items-center space-x-2">
									<Switch
										id="admin"
										checked={newUserIsAdmin}
										onCheckedChange={setNewUserIsAdmin}
									/>
									<Label htmlFor="admin" className="text-sm text-gray-600">
										Grant admin access
									</Label>
								</div>
							</div>
						</div>

						<Button type="submit" disabled={isCreating}>
							{isCreating ? 'Creating...' : 'Add User'}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Users List */}
			<Card>
				<CardHeader>
					<CardTitle>Users ({users.length})</CardTitle>
					<CardDescription>
						Manage users and their permissions. Only listed users can sign in to
						the system.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
							{error}
						</div>
					)}

					<div className="space-y-3">
						{users.map(user => (
							<div
								key={user._id}
								className="flex items-center justify-between p-4 border rounded-lg"
							>
								<div className="flex items-center space-x-3">
									<div className="flex-shrink-0">
										{user.isAdmin ? (
											<Shield className="h-5 w-5 text-blue-600" />
										) : (
											<User className="h-5 w-5 text-gray-400" />
										)}
									</div>
									<div>
										<div className="font-medium">{user.email}</div>
										<div className="text-sm text-gray-500">
											Created {new Date(user.createdAt).toLocaleDateString()}
										</div>
									</div>
								</div>

								<div className="flex items-center space-x-3">
									<div className="flex items-center space-x-2">
										{user.hasCompleteProfile ? (
											<Badge
												variant="secondary"
												className="text-green-700 bg-green-100"
											>
												<CheckCircle className="h-3 w-3 mr-1" />
												Complete Profile
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-orange-700 bg-orange-50"
											>
												<XCircle className="h-3 w-3 mr-1" />
												Incomplete Profile
											</Badge>
										)}

										{user.isAdmin && <Badge variant="default">Admin</Badge>}
									</div>

									{user.email !== session?.user?.email && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => toggleUserAdmin(user.email, user.isAdmin)}
										>
											{user.isAdmin ? 'Remove Admin' : 'Make Admin'}
										</Button>
									)}
								</div>
							</div>
						))}

						{users.length === 0 && (
							<div className="text-center py-8 text-gray-500">
								No users found. Add the first user above.
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
