## Next.js Dynamic Route Handling

For any API route or page that must always return up-to-date, user-specific, or sensitive data (such as admin dashboards or authenticated endpoints), you must use:

```typescript
export const dynamic = 'force-dynamic';
```

This directive tells Next.js to always render the route on the server for every request, never cache or statically generate it, and ensures that the response is always fresh and secure. This is critical for admin, dashboard, or any authenticated API endpoints.
Scoutly Application Architecture Summary
This document outlines the complete technical architecture for the Scoutly application, a full-stack project with a self-hosted backend on a Raspberry Pi and a globally deployed frontend on Vercel.

High-Level Overview
The architecture is designed to be decoupled, secure, and scalable. It leverages a "hybrid" model where a single Next.js codebase serves two distinct roles: a globally deployed frontend and a self-hosted backend API.

Frontend & Auth (Vercel): A Next.js application hosted on Vercel for high performance, global availability, and handling user authentication via NextAuth.

Backend & Database (Raspberry Pi): The same Next.js application, along with a MongoDB database, running in Docker containers. This instance's primary role is to serve the backend API.

Networking (Cloudflare): Manages the project's DNS and provides a secure tunnel to expose the self-hosted backend services to the internet without opening any ports on the local router.

❗ **Strict Database Access Policy:**
Under NO CIRCUMSTANCE should any part of the codebase (including authentication, serverless functions, or frontend logic) connect directly to the database except for the backend API running on the Raspberry Pi. All data access—including authentication/session enrichment—must be performed via HTTP requests to the backend API endpoints. This ensures security, maintainability, and proper separation of concerns. Direct database access from Vercel, serverless, or frontend code is strictly prohibited.

For the current development phase, all environments (production on Vercel, local development on Windows/WSL, and the backend on the Pi) are configured to connect to the single, centralized database instance running in Docker on the Raspberry Pi. This ensures data consistency across all platforms.

Component Breakdown

1. Vercel (The Frontend)
   Role: Serves the frontend portion (React pages) of the Next.js application to users worldwide. It also runs the serverless functions required for NextAuth (e.g., the /api/auth endpoints).

Domain: The primary domain, jobscoutly.tech, and the www subdomain point directly to Vercel's servers.

Key Configuration:

NEXTAUTH_URL: https://jobscoutly.tech

NEXT_PUBLIC_API_URL: https://api.jobscoutly.tech (Points to the backend API on the Pi).

MONGODB_URI: mongodb://db.jobscoutly.tech:27017/scoutly (Points to the database on the Pi for NextAuth).

2. Raspberry Pi (The Backend Server)
   Role: Acts as the primary application API and database server.

Key Services:

Docker Engine: Runs the containerized Next.js application and the database.

Cloudflare Tunnel (cloudflared): A permanent background service that creates a secure, outbound-only connection from the Pi to the Cloudflare network.

3. Docker Setup (on Raspberry Pi)
   The docker-compose.yml file orchestrates the backend services.

app Service:

Builds from the project's Dockerfile.

Runs the full Next.js application in development mode (npm run dev). Its primary job is to serve the backend API routes (e.g., /api/users, /api/scrape) via the tunnel.

Connects to the database using the internal Docker network address (mongodb://mongodb:27017/scoutly).

Configured with restart: unless-stopped to start automatically on boot.

mongodb Service:

Uses the official mongo:latest image.

Persists data to a Docker volume (mongodb_data) to prevent data loss.

Configured with restart: unless-stopped.

4. Cloudflare (The Network Layer)
   Cloudflare is the critical bridge between the public internet and the private server on the Pi.

DNS Management:

The nameservers for jobscoutly.tech are pointed to Cloudflare.

A and CNAME records for jobscoutly.tech and www point to Vercel.

Cloudflare Tunnel: This is the core of the secure connection. It exposes two hostnames to the internet:

api.jobscoutly.tech: Forwards HTTP traffic to the app container on its exposed port (e.g., 3000).

db.jobscoutly.tech: Forwards raw TCP traffic to the mongodb container on port 27017.

Crucially, the db.jobscoutly.tech DNS record is set to "DNS Only" (grey cloud) to allow the raw database protocol to pass through without interference.

Connection String Guide
The MONGODB_URI is the most critical environment variable and its value depends entirely on the context of where the connection is being made. All three addresses point to the same database.

Environment

MONGODB_URI

Explanation

Vercel Deployment

mongodb://db.jobscoutly.tech:27017/scoutly

Connects from the public internet via the Cloudflare Tunnel.

Local Development (Windows/WSL)

mongodb://db.jobscoutly.tech:27017/scoutly

Connects from your local machine to the Pi via the Cloudflare Tunnel.

Raspberry Pi (.env.local)

mongodb://mongodb:27017/scoutly

The app container connects to the mongodb container over the internal Docker network.

Tools on Pi (e.g., VS Code on Pi)

mongodb://localhost:27017/scoutly

Connects from the Pi's OS directly to the port published by Docker.

Deployment Debugging Summary
During the initial deployment, a persistent and non-obvious connection issue was encountered where the Vercel deployment could not reliably connect to the self-hosted MongoDB instance, despite the Cloudflare Tunnel and local Docker setup being configured correctly.

The Core Problem
The Vercel logs repeatedly showed a MongooseServerSelectionError: getaddrinfo ENOTFOUND db.jobscoutly.tech error within the NextAuth serverless function. This error indicates a DNS resolution failure, meaning the Vercel server could not find the IP address for the given hostname.

The Diagnostic Journey & Findings
Initial Theory (Timeouts & Network Blocks): The first hypotheses centered on connection timeouts due to network latency and potential network blocks. The serverSelectionTimeoutMS option was increased and the Cloudflare DNS record for db.jobscoutly.tech was correctly switched to "DNS Only". These were necessary steps but did not resolve the core ENOTFOUND error.

DNS Resolution Test: To verify Vercel's name resolution capabilities, a temporary debug API route (/api/debug) was created.

Action: The debug route used Node.js's native dns/promises module to look up db.jobscoutly.tech.

Result: The test succeeded, returning a valid IPv6 address: {"status":"success","address":"fd10:aec2:5dae::","family":6}.

The Contradiction: This created a logical paradox. The NextAuth function was failing with ENOTFOUND for an address that another function on the exact same deployment could successfully resolve. This proved the problem was not with the network or DNS configuration itself, but with the application's runtime behavior.

Final Hypothesis (Serverless Race Condition): The contradiction between the successful debug route and the failing NextAuth route points to a race condition. It is hypothesized that the application attempts to establish a global database connection the instant its code is loaded during a "cold start." In that brief moment, the Vercel serverless networking environment may not be fully initialized, causing the initial DNS lookup to fail. This failed connection state is then improperly cached by the Mongoose module for the life of the function.

Next Step: Proposed Solution
The definitive solution to test this hypothesis is to refactor the database connection logic in src/lib/db.ts to use a cached, on-demand connection manager. This new pattern ensures that the database connection is only attempted when it is first needed, giving the serverless environment sufficient time to become "warm" and network-ready. Implementing this robust, serverless-friendly pattern is the next action item.
