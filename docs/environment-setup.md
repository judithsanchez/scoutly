# Environment Configuration Guide

This document explains how to properly configure environment variables for Scoutly across different deployment environments.

## File Structure Overview

```
.env                    # Non-sensitive defaults (committed to git)
.env.local             # Local secrets (ignored by git)
example.env.local      # Template for new developers (committed to git)
.gitignore             # Ensures secrets are not committed
```

## Environment Files Explained

### `.env` - Shared Non-Sensitive Defaults

- **Purpose**: Contains default values that are safe to commit to git
- **Includes**: Public URLs, feature flags, non-sensitive configuration
- **Excludes**: API keys, secrets, personal emails
- **Committed**: ✅ Yes (safe to share)

### `.env.local` - Local Development Secrets

- **Purpose**: Contains your personal secrets and overrides for local development
- **Includes**: API keys, OAuth secrets, personal admin emails
- **Committed**: ❌ No (ignored by git)
- **Required**: ✅ Must be created by each developer

### `example.env.local` - Template

- **Purpose**: Template and documentation for setting up `.env.local`
- **Includes**: All required variables with placeholder values
- **Committed**: ✅ Yes (serves as documentation)

## Quick Setup for New Developers

1. **Copy the template:**

   ```bash
   cp example.env.local .env.local
   ```

2. **Fill in required values in `.env.local`:**

   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (see [Google OAuth Setup](./google-oauth-setup.md))
   - `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
   - `GEMINI_API_KEY` (get from [Google AI Studio](https://aistudio.google.com/app/apikey))
   - `BOOTSTRAP_ADMIN_EMAIL` (your email for admin access)

3. **Start development:**
   ```bash
   npm run dev
   ```

## Environment Detection

The app automatically detects the deployment environment based on:

- **Development**: `NODE_ENV=development` or `DEPLOYMENT_TARGET=development`
- **Vercel Production**: `VERCEL=1` or `DEPLOYMENT_TARGET=vercel`
- **Raspberry Pi Production**: `DEPLOYMENT_TARGET=raspberry-pi`

## Variable Priority (Next.js Loading Order)

Next.js loads environment variables in this order (later overrides earlier):

1. `.env` (always loaded)
2. `.env.local` (loaded in all environments except test)
3. `.env.development` / `.env.production` (environment-specific)
4. `.env.development.local` / `.env.production.local` (environment-specific local)

For Scoutly, we use only `.env` and `.env.local` to keep it simple.

## Required Variables by Environment

### Development (All Environments)

```bash
# Authentication
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_SECRET=xxx

# AI Integration
GEMINI_API_KEY=xxx

# Admin Setup
BOOTSTRAP_ADMIN_EMAIL=your.email@gmail.com
```

### Additional for Production

```bash
# Environment-specific URLs
NEXT_PUBLIC_FRONTEND_URL=https://scoutly.app
NEXT_PUBLIC_BACKEND_URL=https://api.scoutly.app

# Production Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/scoutly

# Deployment target
DEPLOYMENT_TARGET=vercel  # or raspberry-pi
```

## Security Best Practices

### ✅ Do's

- Keep all secrets in `.env.local` or production environment variables
- Use different OAuth apps for dev/staging/production
- Generate unique `NEXTAUTH_SECRET` for each environment
- Review `.env` regularly to ensure no secrets leaked in

### ❌ Don'ts

- Never commit real API keys or secrets to git
- Don't put personal information in `.env`
- Don't use production secrets in development
- Don't share your `.env.local` file

## Troubleshooting

### "Authentication not working"

1. Check Google OAuth setup in [Google Cloud Console](https://console.cloud.google.com/)
2. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
3. Ensure authorized redirect URIs include your domain

### "NextAuth error"

1. Verify `NEXTAUTH_SECRET` is set and unique
2. Check `NEXTAUTH_URL` matches your current domain
3. Ensure MongoDB is running and accessible

### "Admin access denied"

1. Verify `BOOTSTRAP_ADMIN_EMAIL` matches your Google account
2. Check if you're in the MongoDB users collection
3. Run the setup script: `npm run setup:user`

### "Environment detection wrong"

1. Check `DEPLOYMENT_TARGET` environment variable
2. Verify production environment variables are set
3. Check `src/config/environment.ts` for detection logic

## Additional Resources

- [Google OAuth Setup Guide](./google-oauth-setup.md)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
