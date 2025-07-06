# Environment Configuration Guide

**Scoutly never exposes secrets or database credentials to the client. All sensitive operations are server-side only.**

## File Structure Overview

```
.env                    # Non-sensitive defaults (committed to git)
.env.local              # Local secrets (ignored by git)
example.env.local       # Template for new developers (committed to git)
.gitignore              # Ensures secrets are not committed
```

## Environment Files Explained

### `.env` - Shared Non-Sensitive Defaults

- Contains default values safe to commit to git
- Public URLs, feature flags, non-sensitive config only
- No API keys, secrets, or personal emails

### `.env.local` - Local Development Secrets

- Contains your personal secrets and overrides for local development
- API keys, OAuth secrets, admin emails, DB credentials
- Must never be committed to git

### `example.env.local` - Template

- Template for `.env.local` setup
- Placeholder values for all required variables

## Quick Setup for New Developers

1. Copy the template:

   ```bash
   cp example.env.local .env.local
   ```

2. Fill in required values in `.env.local`:

   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `GEMINI_API_KEY`
   - `BOOTSTRAP_ADMIN_EMAIL`
   - `MONGODB_URI` (never exposed to client)

3. Start development:

   ```bash
   npm run dev
   ```

## Environment Detection

- The app detects environment via `NODE_ENV` and `DEPLOYMENT_TARGET`.
- Only server-side code ever reads secrets or DB credentials.

## Variable Priority (Next.js Loading Order)

1. `.env`
2. `.env.local`
3. `.env.development` / `.env.production`
4. `.env.development.local` / `.env.production.local`

Scoutly uses only `.env` and `.env.local` for simplicity.

## Security Best Practices

- Keep all secrets in `.env.local` or production environment variables
- Never commit secrets to git
- Never expose secrets or DB credentials to the client
- All sensitive logic is server-side only

## Troubleshooting

- If authentication or admin access fails, check your `.env.local` values and server logs.
- The client/browser should never have access to secrets or direct DB connections.
