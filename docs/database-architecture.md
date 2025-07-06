# Database Architecture

## Overview

Scoutly uses a secure, API-driven architecture. **The client (frontend) never connects directly to MongoDB.** All database access is handled by server-side API endpoints.

## Architecture Components

### Production Setup

- **Vercel**: Hosts the Next.js application (frontend and API routes)
- **Raspberry Pi**: Runs MongoDB in a Docker container
- **Cloudflare Tunnel**: Secures the connection between Vercel and the Pi

### Connection Flow

```
Client (browser) → Vercel API endpoint → Cloudflare Tunnel → Raspberry Pi:27017 → MongoDB Docker
```

- **No direct client-to-DB access.** All requests go through API endpoints.

## Authentication

MongoDB is configured with authentication enabled:

- **Username**: `scoutly_admin`
- **Password**: Defined in environment variables
- **Database**: `scoutly`
- **Auth Source**: `admin`

## Environment Configuration

### Production (Vercel)

```env
MONGODB_URI=mongodb://scoutly_admin:password@db.jobscoutly.tech:443/scoutly?authSource=admin
```

### Local Development (Docker)

```env
MONGODB_URI_LOCAL=mongodb://scoutly_admin:password@localhost:27017/scoutly?authSource=admin
```

### External Tools (VS Code MongoDB Extension)

```env
MONGODB_URI_EXTERNAL=mongodb://scoutly_admin:password@db.jobscoutly.tech:443/scoutly?authSource=admin
```

## Security Features

1. **Authentication**: All database connections require username/password
2. **Encrypted Tunnel**: Cloudflare tunnel provides TLS encryption
3. **No Direct Exposure**: Database port not directly exposed to internet
4. **Access Control**: Only authenticated applications can connect
5. **API-Only Access**: The client never connects directly to the database

## Raspberry Pi Setup

The Pi runs MongoDB in Docker with:

- Authentication enabled (`--auth` flag)
- Bound to all interfaces (`--bind_ip_all`)
- Data persistence via Docker volumes
- Health checks for reliability

## Cloudflare Tunnel Configuration

The tunnel routes:

- `api.jobscoutly.tech` → Next.js app (when running on Pi)
- `db.jobscoutly.tech` → MongoDB TCP port

## Connection Testing

To test the database connection (server-side only):

```bash
# Using mongosh
mongosh "mongodb://scoutly_admin:password@db.jobscoutly.tech:443/scoutly?authSource=admin"

# Using MongoDB Compass
mongodb://scoutly_admin:password@db.jobscoutly.tech:443/scoutly?authSource=admin
```

**Never expose these URIs to the client or browser.**

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Check username/password in environment variables
2. **Connection Timeout**: Verify Cloudflare tunnel is running
3. **Database Unavailable**: Check MongoDB Docker container on Pi

### Health Checks

- MongoDB health check in Docker Compose
- Cloudflare tunnel status via dashboard
- Vercel deployment logs for connection errors
