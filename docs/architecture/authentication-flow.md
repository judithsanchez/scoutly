# Authentication Flow: API Proxy Model

## Overview

This document describes the new authentication flow for Scoutly, using a secure API Proxy model. The frontend (Vercel) never talks directly to the database; all sensitive operations are proxied through the Raspberry Pi backend.

## Sequence

1. **User initiates sign-in** via the browser (Google OAuth).
2. **Vercel (Next.js)** receives the sign-in and calls the Pi API `/internal/verify-user` with the user's email and the `x-internal-secret` header.
3. **Raspberry Pi API** checks the database for the user and returns `{ exists: true/false }`.
4. If allowed, Vercel calls `/internal/user-details` to fetch user details for the session token.
5. **All communication** between Vercel and Pi is secured with the `x-internal-secret` header.

## Security

- The `INTERNAL_API_SECRET` must be identical and secret on both Vercel and the Pi.
- No direct database access from Vercel.
- Only the Pi backend and its internal services may access the database.

## See Also

- [authentication-flow.mmd](./authentication-flow.mmd) for the sequence diagram.
