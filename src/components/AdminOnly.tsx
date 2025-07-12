'use client';

import React from 'react';
import {useAuth} from '@/contexts/AuthContext';

export default function AdminOnly({children}: {children: React.ReactNode}) {
	const {user} = useAuth();

	if (!user || !user.isAdmin) {
		return <p>Access denied. Admins only.</p>;
	}

	return <>{children}</>;
}
