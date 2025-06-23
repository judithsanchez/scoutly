# Authentication System Implementation

## Overview

This document describes the implementation of the new pre-approval-based Google OAuth authentication system for Scoutly, designed to support multiple deployment environments.

## Architecture

### Environment-Aware Authentication

The system detects three deployment environments:

1. **Development** (`localhost`): Relaxed auth for testing
2. **Vercel** (Frontend production): Hosted frontend on Vercel
3. **Raspberry Pi** (Backend production): Self-hosted backend API

### Pre-Approval System

Only users present in the MongoDB `User` collection can sign in. This provides:

- **Security**: Controlled access to the application
- **User Management**: Admin-controlled user registration
- **Profile Gating**: Job scouting requires complete profiles

## Components

### Core Files

- `src/config/environment.ts` - Environment detection and configuration
- `src/lib/auth.ts` - NextAuth configuration with pre-approval logic
- `src/types/next-auth.d.ts` - Extended session types
- `src/middleware.ts` - Route protection middleware
- `src/utils/profileUtils.ts` - Profile completion utilities

### API Endpoints

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user (admin only)
- `PATCH /api/admin/users` - Update user admin status

### UI Components

- `src/components/admin/UserManagement.tsx` - Admin user management interface
- `src/app/auth/error/page.tsx` - Authentication error handling
- Updated `src/app/admin/page.tsx` - Admin dashboard with user management tab

## Environment Configuration

### Required Environment Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_URL=your_app_url
NEXTAUTH_SECRET=your_nextauth_secret

# Environment Detection
DEPLOYMENT_TARGET=development|vercel|raspberry-pi
NEXT_PUBLIC_FRONTEND_URL=your_frontend_url
NEXT_PUBLIC_BACKEND_URL=your_backend_url

# Development Only
NEXT_PUBLIC_SKIP_AUTH=true # Bypass auth checks in dev
```

### Deployment-Specific Settings

#### Development

- `DEPLOYMENT_TARGET=development`
- `NEXT_PUBLIC_SKIP_AUTH=true` for testing
- Both frontend and backend on `localhost:3000`

#### Vercel (Frontend)

- Auto-detected via `VERCEL` environment variable
- Frontend URL from Vercel, backend URL points to Raspberry Pi
- CORS handling for cross-origin requests

#### Raspberry Pi (Backend)

- `DEPLOYMENT_TARGET=raspberry-pi`
- Backend URL is local, frontend URL points to Vercel
- Serves API endpoints to Vercel frontend

## User Access Levels

### Authentication Flow

1. **Sign-in Attempt**: User tries to sign in with Google
2. **Pre-approval Check**: System verifies user exists in User collection
3. **Session Creation**: If approved, create session with user metadata
4. **Route Protection**: Middleware enforces access rules

### Access Rules

- **Public Routes**: Home page, auth pages
- **Authenticated Routes**: Dashboard, profile (requires sign-in)
- **Complete Profile Routes**: Job scouting features (requires CV + profile data)
- **Admin Routes**: Admin dashboard, user management (requires admin flag)

## Profile Completion

Users must complete their profile to access job scouting:

### Required Fields

- CV/Resume upload (`cvUrl`)
- Basic candidate information (`candidateInfo`)

### Gating Logic

- `hasCompleteProfile()` - Checks if user can access job features
- `getUserAccessLevel()` - Returns comprehensive access permissions
- Middleware redirects incomplete profiles to `/profile?required=true`

## Admin Management

### Bootstrap Admin

- Initial admin via `BOOTSTRAP_ADMIN_EMAIL` environment variable
- Fallback for first-time setup

### Database Admins

- `AdminUser` collection stores promoted admins
- Admins can promote/demote other users
- Admin status persists in session and JWT

### Admin Capabilities

- View all users and their status
- Add new users to the system
- Promote users to admin
- Access admin dashboard and system metrics

## Security Features

### Pre-approval System

- Only database users can sign in
- Rejects unauthorized sign-in attempts
- Clear error messaging for denied access

### Environment-Specific Security

- Development mode has relaxed checks for testing
- Production enforces strict authentication
- Cross-origin protection for distributed deployment

### Session Management

- JWT-based sessions for cross-domain support
- Session enrichment with user metadata
- Automatic profile status updates

## Error Handling

### Authentication Errors

- Access denied page for unauthorized users
- Configuration error handling
- Network error recovery

### User Experience

- Clear error messages
- Helpful guidance for access requests
- Retry mechanisms for transient failures

## Testing Strategy

### Development Testing

- `NEXT_PUBLIC_SKIP_AUTH=true` bypasses checks
- Bootstrap admin for initial access
- Local database for user management

### Production Testing

- Pre-seed User collection with test accounts
- Verify cross-origin authentication works
- Test profile completion flow

## Deployment Considerations

### Vercel Frontend

- Environment variables for Google OAuth
- CORS configuration for Raspberry Pi backend
- Session persistence across deployments

### Raspberry Pi Backend

- API endpoint accessibility from Vercel
- Database connectivity and security
- SSL/TLS configuration for production

### Database Setup

- Ensure User and AdminUser collections exist
- Seed initial admin user
- Configure connection strings for each environment

## Future Enhancements

- Email invitation system for new users
- Role-based permissions beyond admin/user
- Audit logging for admin actions
- Bulk user import/export functionality
- Profile completion wizard for new users
