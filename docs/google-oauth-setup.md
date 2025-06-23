# Google OAuth Setup Guide

## Overview

This guide will help you set up Google OAuth for Scoutly's pre-approval authentication system, supporting the cross-domain architecture (Vercel frontend + Raspberry Pi backend).

## Google Cloud Console Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (required for OAuth)

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - App name: `Scoutly`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (your email addresses that you want to test with)

### 3. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Application type: **Web application**
4. Name: `Scoutly Web Client`
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (development)
   - `https://your-app.vercel.app` (production frontend)
   - `https://your-pi-domain.com` (if accessible via HTTPS)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-app.vercel.app/api/auth/callback/google` (production)
   - `https://your-pi-domain.com/api/auth/callback/google` (if backend handles auth)

## Environment Configuration

### Development (.env.local)

```bash
# Environment Configuration
DEPLOYMENT_TARGET=development
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_32_character_secret_here

# Database
MONGODB_URI=mongodb://localhost:27017/scoutly

# Admin Configuration
BOOTSTRAP_ADMIN_EMAIL=your_email@gmail.com

# Development Auth Settings
NEXT_PUBLIC_SKIP_AUTH=false  # Set to true to bypass auth in dev
```

### Production - Vercel (.env for Vercel deployment)

```bash
# Environment Configuration
DEPLOYMENT_TARGET=vercel
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
NEXT_PUBLIC_BACKEND_URL=https://your-raspberry-pi-domain.com

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_random_32_character_secret_here

# Database (MongoDB Atlas or your Pi's MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scoutly

# Admin Configuration
BOOTSTRAP_ADMIN_EMAIL=your_email@gmail.com
```

### Production - Raspberry Pi (.env for Pi deployment)

```bash
# Environment Configuration
DEPLOYMENT_TARGET=raspberry-pi
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
NEXT_PUBLIC_BACKEND_URL=https://your-raspberry-pi-domain.com

# Google OAuth Configuration (if handling auth on Pi)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=https://your-raspberry-pi-domain.com
NEXTAUTH_SECRET=your_random_32_character_secret_here

# Database
MONGODB_URI=mongodb://localhost:27017/scoutly

# Admin Configuration
BOOTSTRAP_ADMIN_EMAIL=your_email@gmail.com
```

## Setup Steps

### 1. Add Your Email to the Database

First, you need to add your email to the User collection so you can sign in:

```bash
# Using Docker Compose (development)
docker-compose exec app npx tsx -e "
import { connectToDatabase } from './src/lib/mongodb.js';
import { User } from './src/models/User.js';

async function addUser() {
  await connectToDatabase();

  const user = new User({
    email: 'your_email@gmail.com', // Replace with your actual email
  });

  await user.save();
  console.log('User added successfully');
  process.exit(0);
}

addUser().catch(console.error);
"
```

### 2. Start the Development Server

```bash
# Start the application
docker-compose up -d

# Check logs
docker-compose logs -f app
```

### 3. Test the Authentication Flow

1. Navigate to `http://localhost:3000`
2. Click on the sign-in link or go to `http://localhost:3000/auth/signin`
3. Click "Sign in with Google"
4. Complete the OAuth flow
5. You should be redirected back to the app and logged in

## Pre-Approval System

### How It Works

1. **User attempts to sign in** with Google OAuth
2. **System checks** if the user's email exists in the `User` collection
3. **If found**: Login succeeds, user gets access
4. **If not found**: Login is rejected with "Access Denied" error
5. **Admin can add users** via the admin panel at `/admin`

### Adding Users (Admin Panel)

1. Go to `http://localhost:3000/admin` (you need to be an admin)
2. Navigate to the "User Management" tab
3. Enter the email address of the user you want to add
4. Optionally check "Admin Privileges" to make them an admin
5. Click "Add User"

### Adding Users (API)

```bash
# Using curl (replace with your admin email)
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "x-admin-email: your_admin_email@gmail.com" \
  -d '{
    "email": "newuser@example.com",
    "isAdmin": false
  }'
```

## Profile Completion

Users need to complete their profile (upload CV + candidate info) to access job scouting features:

1. **Incomplete Profile**: Can access dashboard but not job features
2. **Complete Profile**: Full access to all features
3. **Profile completion** is checked in middleware and session

## Cross-Domain Considerations

### CORS Configuration

The system handles cross-origin requests between Vercel frontend and Raspberry Pi backend:

```javascript
// Environment-aware CORS origins
const allowedOrigins = [
	'https://your-app.vercel.app',
	'https://your-raspberry-pi-domain.com',
	'http://localhost:3000',
];
```

### Session Strategy

- Uses **JWT strategy** instead of database sessions for better cross-domain support
- Session data includes: `email`, `isAdmin`, `hasCompleteProfile`, `cvUrl`

## Troubleshooting

### Common Issues

1. **"Access Denied" error**: User email not in database

   - Add the user via admin panel or API

2. **OAuth redirect mismatch**: Incorrect redirect URIs in Google Console

   - Update Google Console with correct URLs

3. **CORS errors**: Frontend/backend domain mismatch

   - Check environment variables and allowed origins

4. **Session not persisting**: Incorrect NEXTAUTH_SECRET or URL
   - Verify environment variables match deployment environment

### Debug Commands

```bash
# Check user exists in database
docker-compose exec app npx tsx -e "
import { connectToDatabase } from './src/lib/mongodb.js';
import { User } from './src/models/User.js';

async function checkUser() {
  await connectToDatabase();
  const user = await User.findOne({ email: 'your_email@gmail.com' });
  console.log('User found:', user);
  process.exit(0);
}

checkUser().catch(console.error);
"

# Check admin status
docker-compose exec app npx tsx -e "
import { connectToDatabase } from './src/lib/mongodb.js';
import { AdminUser } from './src/models/AdminUser.js';

async function checkAdmin() {
  await connectToDatabase();
  const admin = await AdminUser.findOne({ email: 'your_email@gmail.com' });
  console.log('Admin found:', admin);
  process.exit(0);
}

checkAdmin().catch(console.error);
"
```

## Security Notes

1. **Pre-approval required**: Only users in the database can sign in
2. **Admin privileges**: Separately managed in AdminUser collection
3. **Environment-aware**: Different behavior for dev/Vercel/Pi deployments
4. **Profile gating**: Job features require complete profile
5. **CORS protection**: Restricts origins based on environment

## Next Steps

After setup:

1. Test login with your Google account
2. Add other users via the admin panel
3. Test profile completion flow
4. Deploy to Vercel for frontend
5. Set up Raspberry Pi for backend
6. Configure production environment variables
