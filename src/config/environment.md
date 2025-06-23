# Environment Configuration

## Overview

This document outlines the environment-specific configuration for the Scoutly authentication system, designed to support three deployment scenarios:

1. **Development** - Local development with localhost
2. **Vercel** - Frontend production deployment on Vercel
3. **Raspberry Pi** - Backend production deployment on Raspberry Pi

## Environment Detection

The system automatically detects the current environment using these indicators:

```typescript
function detectEnvironment(): Environment {
	// Vercel deployment
	if (process.env.VERCEL || process.env.VERCEL_URL) {
		return 'vercel';
	}

	// Raspberry Pi deployment
	if (
		process.env.DEPLOYMENT_TARGET === 'raspberry-pi' ||
		process.env.IS_RASPBERRY_PI === 'true' ||
		(process.env.NODE_ENV === 'production' && !process.env.VERCEL)
	) {
		return 'raspberry-pi';
	}

	// Default to development
	return 'development';
}
```

## Deployment Scenarios

### Development Environment

**Use Case**: Local development and testing  
**URLs**: Both frontend and backend on `localhost:3000`  
**Auth Mode**: Relaxed (can be bypassed with `NEXT_PUBLIC_SKIP_AUTH=true`)

```bash
# .env.local
DEPLOYMENT_TARGET=development
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_SKIP_AUTH=true

# Google OAuth (development)
GOOGLE_CLIENT_ID=your_dev_google_client_id
GOOGLE_CLIENT_SECRET=your_dev_google_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_dev_secret

# Database
MONGODB_URI=mongodb://localhost:27017/scoutly

# Admin
BOOTSTRAP_ADMIN_EMAIL=admin@scoutly.app
```

### Vercel Frontend Deployment

**Use Case**: Production frontend hosting  
**URLs**: Frontend on Vercel, backend API calls to Raspberry Pi  
**Auth Mode**: Strict pre-approval system

```bash
# Vercel Environment Variables
DEPLOYMENT_TARGET=vercel  # Optional (auto-detected)
NEXT_PUBLIC_FRONTEND_URL=https://scoutly.vercel.app
NEXT_PUBLIC_BACKEND_URL=https://your-pi-domain.com

# Google OAuth (production)
GOOGLE_CLIENT_ID=your_prod_google_client_id
GOOGLE_CLIENT_SECRET=your_prod_google_client_secret

# NextAuth
NEXTAUTH_URL=https://scoutly.vercel.app
NEXTAUTH_SECRET=your_prod_secret

# Database (connection to Pi or cloud MongoDB)
MONGODB_URI=mongodb://your-pi-ip:27017/scoutly

# Admin
BOOTSTRAP_ADMIN_EMAIL=admin@scoutly.app
```

### Raspberry Pi Backend Deployment

**Use Case**: Self-hosted backend API server  
**URLs**: Backend serves API, frontend hosted on Vercel  
**Auth Mode**: Strict pre-approval system with CORS for Vercel

```bash
# .env (on Raspberry Pi)
DEPLOYMENT_TARGET=raspberry-pi
NEXT_PUBLIC_FRONTEND_URL=https://scoutly.vercel.app
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000  # Or your Pi's domain

# Google OAuth (production)
GOOGLE_CLIENT_ID=your_prod_google_client_id
GOOGLE_CLIENT_SECRET=your_prod_google_client_secret

# NextAuth
NEXTAUTH_URL=http://your-pi-domain.com  # Or your Pi's public URL
NEXTAUTH_SECRET=your_prod_secret

# Database (local MongoDB on Pi)
MONGODB_URI=mongodb://localhost:27017/scoutly

# Admin
BOOTSTRAP_ADMIN_EMAIL=admin@scoutly.app

# Pi-specific
IS_RASPBERRY_PI=true
NODE_ENV=production
```

## CORS and Cross-Origin Configuration

### Vercel → Raspberry Pi Communication

The system handles cross-origin requests between Vercel frontend and Raspberry Pi backend:

```typescript
// Allowed origins based on environment
const allowedOrigins = {
	development: ['http://localhost:3000', 'http://127.0.0.1:3000'],
	vercel: [
		'https://scoutly.vercel.app',
		'https://scoutly-preview.vercel.app', // Preview deployments
		'https://your-pi-domain.com',
	],
	'raspberry-pi': [
		'https://scoutly.vercel.app',
		'http://localhost:3000',
		'https://your-pi-domain.com',
	],
};
```

### NextAuth Session Strategy

For cross-domain authentication, the system uses JWT sessions:

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
	session: {
		strategy: 'jwt', // Required for cross-domain support
	},
	// ... other config
};
```

## Google OAuth Setup

### Development Setup

1. Create a Google OAuth application in Google Cloud Console
2. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`

### Production Setup

1. Update the existing OAuth application or create a new one
2. Add authorized redirect URIs:
   - `https://scoutly.vercel.app/api/auth/callback/google`
   - `https://your-pi-domain.com/api/auth/callback/google` (if Pi handles auth)

## Database Connectivity

### Development

- Local MongoDB instance
- Connection: `mongodb://localhost:27017/scoutly`

### Production Options

**Option 1: Pi-hosted MongoDB**

```bash
# Both Vercel and Pi connect to Pi's MongoDB
MONGODB_URI=mongodb://your-pi-ip:27017/scoutly
```

**Option 2: Cloud MongoDB (Recommended)**

```bash
# Both environments connect to cloud database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scoutly
```

## Security Considerations

### Environment-Specific Security

1. **Development**: Relaxed for testing convenience
2. **Production (Vercel + Pi)**: Strict authentication and CORS

### Network Security

- Pi should have proper firewall configuration
- Database access should be restricted to known IPs
- Use HTTPS in production environments
- Keep Google OAuth secrets secure and environment-specific

### Session Security

- Different `NEXTAUTH_SECRET` for each environment
- JWT tokens include environment-specific claims
- Session persistence across Vercel deployments

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check `allowedOrigins` configuration
2. **Auth Redirects**: Verify `NEXTAUTH_URL` matches deployment URL
3. **Database Connection**: Ensure MongoDB is accessible from both environments
4. **Google OAuth**: Check redirect URIs match exactly

### Debug Commands

```bash
# Check environment detection
node -e "console.log(require('./src/config/environment').environmentConfig)"

# Test database connection
npm run docker:debug-user

# Verify auth configuration
curl -I https://scoutly.vercel.app/api/auth/signin
```

## Migration Steps

### From Development to Production

1. Set up Google OAuth for production domains
2. Configure environment variables in Vercel
3. Set up Raspberry Pi with production environment
4. Update database connection strings
5. Test cross-origin authentication flow
6. Seed initial admin user in production database

### Rollback Plan

- Keep development environment unchanged
- Maintain separate OAuth applications
- Use environment-specific database instances
- Monitor logs for auth-related errors
