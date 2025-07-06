# Google OAuth Setup Guide

**All authentication is handled server-side. The client never receives secrets or direct database access.**

## Overview

Scoutly uses Google OAuth for authentication. Only pre-approved users (in the User collection) can log in. Admin status is managed in the `AdminUser` collection, never by the client.

## Google Cloud Console Setup

1. Create or select a Google Cloud project.
2. Configure the OAuth consent screen (type: External).
3. Add required scopes: `email`, `profile`, `openid`.
4. Add your email as a test user.
5. Create OAuth 2.0 credentials (Web application).
6. Set authorized origins and redirect URIs for both local and production.

## Environment Configuration

- All OAuth secrets and credentials are stored in `.env.local` (never exposed to the client).
- Example `.env.local` entries:
  ```
  GOOGLE_CLIENT_ID=your_google_client_id_here
  GOOGLE_CLIENT_SECRET=your_google_client_secret_here
  NEXTAUTH_SECRET=your_random_32_character_secret_here
  NEXTAUTH_URL=http://localhost:3000
  ```

## Authentication Flow

1. User clicks "Sign in with Google" in the frontend.
2. The frontend calls the Next.js API route for authentication.
3. The server handles the OAuth flow and checks if the user is pre-approved (exists in the User collection).
4. If approved, the user is logged in. If not, access is denied.
5. **At no point does the client receive secrets or direct DB access.**

## Admin and User Management

- Only users in the User collection can log in.
- Admin status is managed via the `AdminUser` collection.
- To promote a user to admin, use the API endpoint:
  - `POST /api/admin/promote` with the internal secret and the user's email.
- To add a user, use the admin panel or a server-side script/API endpoint.

## Security Notes

- All sensitive logic and credentials are server-side only.
- The client never receives or sends secrets, tokens, or DB credentials.
- All user and admin management is via API endpoints, never direct DB access from the client.

## Troubleshooting

- If login fails, check your `.env.local` values and ensure your email is in the User collection.
- If admin access fails, ensure your email is in the AdminUser collection (use the promote endpoint).
