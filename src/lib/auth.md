# Authentication System Documentation

## Overview

The authentication system has been refactored to use a clean, environment-based approach that separates development and production authentication logic without scattered bypass code in production files.

## Architecture

### Factory Pattern

The main `auth.ts` file uses a factory pattern to select the appropriate authentication provider based on the `NEXT_PUBLIC_USE_DEV_AUTH` environment variable:

- **Production Mode** (`NEXT_PUBLIC_USE_DEV_AUTH=false`): Uses `auth.production.ts` - requires pre-approved users in the database

### File Structure

```
src/lib/
├── auth.ts                    # Factory that selects dev/prod provider
├── auth.development.ts        # Development-only provider (auto-approve)
├── auth.production.ts         # Production provider (pre-approval required)
└── __tests__/
    ├── auth.test.ts          # Production auth tests
    └── auth.development.test.ts # Development auth tests
```

## Environment Configuration

### API Routing Pattern (Frontend → Production Backend)

**IMPORTANT:**  
The frontend (even in local development) must always call the production backend for all API/database operations.

- The frontend never talks directly to the database.
- The frontend never talks to a local backend (unless explicitly testing local API).
- All API calls go to the production backend, which is responsible for all DB access and business logic.

**How to configure:**

- Set `NEXT_PUBLIC_API_URL` (or `NEXT_PUBLIC_BACKEND_URL`) in your `.env.local` to the production backend URL (e.g., `https://api.jobscoutly.tech`).
- The API client in the frontend will prepend this base URL to all API requests.
- CORS must be enabled on the backend to allow requests from your local frontend.

Example `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.jobscoutly.tech
```

### Production Setup

```env
# Require pre-approved users (default/recommended)
NEXT_PUBLIC_USE_DEV_AUTH=false
```

## Production Authentication Features

When `NEXT_PUBLIC_USE_DEV_AUTH=false` (default):

- 🔒 Only allows pre-approved users (must exist in User collection)
- 🔒 Strict email validation
- 🔒 No bypass logic or development shortcuts
- 🔒 Secure session handling

## Testing

### Running Auth Tests

```bash
# Test development auth provider
docker-compose exec app npm test -- src/lib/__tests__/auth.development.test.ts

# Test production auth provider
docker-compose exec app npm test -- src/lib/__tests__/auth.test.ts

# Test all auth functionality
docker-compose exec app npm test -- src/lib/__tests__/auth
```

### Test Coverage

- ✅ Development auth auto-approval
- ✅ Development user auto-creation
- ✅ Production pre-approval enforcement
- ✅ Session enrichment with user data
- ✅ Admin role detection

## Migration from Legacy System

### Removed Environment Variables

- ❌ `NEXT_PUBLIC_SKIP_AUTH` (replaced with `NEXT_PUBLIC_USE_DEV_AUTH`)
- ❌ `NEXT_PUBLIC_DEV_USER_EMAIL` (removed, user identity is always session-based)
- ❌ `NEXT_PUBLIC_DEV_USER_NAME` (now auto-generated from Google OAuth)

### Removed Bypass Logic

- ❌ Skip-auth checks in `middleware.ts`
- ❌ Development bypass in `AuthContext.tsx`
- ❌ Scattered conditional authentication logic

## Security Benefits

1. **Clean Separation**: Development and production auth logic is completely separated
2. **No Production Bypass**: Production code contains no development shortcuts
3. **Single Toggle**: One environment variable controls auth behavior
4. **Explicit Configuration**: Clear documentation of auth modes
5. **Test Coverage**: Comprehensive tests for both modes

## Troubleshooting

### Common Issues

**Docker warnings about old environment variables**

- Update any remaining references to old variables in documentation
- Clear Docker cache: `docker-compose down && docker-compose up -d`

**Authentication not working in development**

- Verify `NEXT_PUBLIC_USE_DEV_AUTH=true` in `.env.local`
- Check Google OAuth configuration
- Check Docker container logs: `docker-compose logs app`

**Users can't sign in to production**

- Verify `NEXT_PUBLIC_USE_DEV_AUTH=false`
- Ensure users are pre-approved in the User collection
- Check database connectivity

## Implementation Status

- ✅ Factory pattern implemented
- ✅ Development auth provider created
- ✅ Production auth provider created
- ✅ Legacy bypass logic removed
- ✅ Environment variables updated
- ✅ Tests passing
- ✅ Documentation updatedbash

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
- `NEXT_PUBLIC_API_URL=https://api.jobscoutly.tech` (always use production backend for API calls)
- CORS must be enabled on the backend for `localhost:3000` (or your dev frontend origin)
- No local backend/database is required for frontend development

#### Vercel (Frontend)

- Auto-detected via `VERCEL` environment variable
- Frontend URL from Vercel, backend URL points to production backend (e.g., Raspberry Pi or cloud)
- CORS handling for cross-origin requests

#### Raspberry Pi (Backend)

- `DEPLOYMENT_TARGET=raspberry-pi`
- Backend URL is local, frontend URL points to Vercel or local dev
- Serves API endpoints to Vercel frontend and local dev frontend

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

## Session Enrichment & Profile Fetching

### Internal Session Endpoint

- `/api/internal/auth/session` is used by the authentication system (e.g., NextAuth JWT callback) to enrich the session token.
- Returns only: `isAdmin`, `hasCompleteProfile`, and `email`.
- Protected by the `X-Internal-API-Secret` header.

### Profile Page Endpoint

- `/api/users/profile` is used by the profile page to fetch profile-relevant information for the authenticated user.
- Returns: `email`, `name`, `cvUrl`, `candidateInfo`, `hasCompleteProfile`.
- Does **not** include tracked companies or saved jobs.
- Requires a valid session (no internal secret).

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
```
