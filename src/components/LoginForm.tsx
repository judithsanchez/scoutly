'use client';

import React, {useState, useEffect} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {useRouter} from 'next/navigation';

export default function LoginForm() {
	const {login, user, logout} = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (user) {
			router.push('/dashboard');
		}
	}, [user, router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			const res = await fetch('/api/users/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Internal-API-Secret':
						process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? '',
				},
				body: JSON.stringify({email, password}),
			});
			const data = await res.json();
			if (res.ok && data.token) {
				login(data.token);
			} else {
				setError(data.error || 'Login failed');
			}
		} catch (err) {
			setError('Login failed');
		} finally {
			setLoading(false);
		}
	};

	if (user) {
		// Optionally, you could show a loading spinner here while redirecting
		return null;
	}

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="email"
				placeholder="Email"
				value={email}
				onChange={e => setEmail(e.target.value)}
				required
			/>
			<input
				type="password"
				placeholder="Password"
				value={password}
				onChange={e => setPassword(e.target.value)}
				required
			/>
			<button type="submit" disabled={loading}>
				{loading ? 'Logging in...' : 'Login'}
			</button>
			{error && <p style={{color: 'red'}}>{error}</p>}
		</form>
	);
}
