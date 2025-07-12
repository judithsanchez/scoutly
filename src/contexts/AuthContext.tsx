'use client';

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';
import {jwtDecode} from 'jwt-decode';

type UserSession = {
	userId: string;
	email: string;
	isAdmin: boolean;
	exp: number;
	iat: number;
};

type AuthContextType = {
	token: string | null;
	user: UserSession | null;
	login: (token: string) => void;
	logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
	token: null,
	user: null,
	login: () => {},
	logout: () => {},
});

export function AuthProvider({children}: {children: ReactNode}) {
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<UserSession | null>(null);

	useEffect(() => {
		// Try to load token from localStorage on mount
		const stored =
			typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
		if (stored) {
			setToken(stored);
			try {
				setUser(jwtDecode<UserSession>(stored));
			} catch {
				setUser(null);
			}
		}
	}, []);

	const login = (newToken: string) => {
		setToken(newToken);
		localStorage.setItem('jwt', newToken);
		try {
			setUser(jwtDecode<UserSession>(newToken));
		} catch {
			setUser(null);
		}
	};

	const logout = () => {
		setToken(null);
		setUser(null);
		localStorage.removeItem('jwt');
	};

	return (
		<AuthContext.Provider value={{token, user, login, logout}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
