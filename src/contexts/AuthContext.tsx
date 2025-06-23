'use client';

import React, {createContext, useContext, ReactNode} from 'react';
import {useSession} from 'next-auth/react';

type User = {
	email: string;
	name?: string;
	image?: string;
};

type AuthContextType = {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	isAuthenticated: false,
	isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({children}: AuthProviderProps) => {
	const {data: session, status} = useSession();

	const value = {
		user: session?.user as User | null,
		isAuthenticated: status === 'authenticated',
		isLoading: status === 'loading',
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
