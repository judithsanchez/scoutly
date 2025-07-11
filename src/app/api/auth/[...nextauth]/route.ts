// /src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import {authOptions} from '@/lib/auth'; // <-- This is the only change needed

// The NextAuth function is initialized with the unified authOptions
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests, as required by NextAuth.js
export {handler as GET, handler as POST};
