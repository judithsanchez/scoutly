'use client';

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';
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
	isDevBypass: boolean;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	isAuthenticated: false,
	isLoading: true,
	isDevBypass: false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({children}: AuthProviderProps) => {
	const {data: session, status} = useSession();
	const [isDevBypass, setIsDevBypass] = useState(false);

	// Check if we're in development mode and should bypass auth
	useEffect(() => {
		const isDev = process.env.NODE_ENV === 'development';
		const shouldBypass = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true';
		setIsDevBypass(isDev && shouldBypass);
	}, []);

	// Default dev user when bypassing auth
	const devUser: User = {
		email: 'dev@scoutly.app',
		name: 'Development User',
	};

	const value = {
		user: isDevBypass ? devUser : (session?.user as User | null),
		isAuthenticated: isDevBypass || status === 'authenticated',
		isLoading: status === 'loading' && !isDevBypass,
		isDevBypass,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
