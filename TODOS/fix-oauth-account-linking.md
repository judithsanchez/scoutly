# Fix OAuth Account Linking - Implementation Plan

## Problem Identified ✅

The current authentication system has a **hybrid approach** causing `OAuthAccountNotLinked` errors:

1. **NextAuth MongoDB Adapter** manages (`accounts`, `sessions`, `users` collections)
2. **Custom User Model** manages profile data (CV, candidate info, tracking preferences)
3. **OAuth linking fails** because these two systems aren't properly connected

## Root Cause Analysis ✅

### Current Flow (BROKEN):
1. User clicks "Sign in with Google"
2. Google OAuth succeeds
3. NextAuth tries to link Google account in `accounts` collection
4. NextAuth looks for user in its own `users` collection (empty)
5. Custom auth callback tries to find user in our `User` collection
6. **Mismatch causes `OAuthAccountNotLinked` error**

### Logs Evidence:
```
Dev Auth: User judithv.sanchezc@gmail.com signed in successfully
OAuthAccountNotLinked error at callback
```

## Solution Strategy: Unified User Management

### Approach: Single User Collection + NextAuth Integration

**Keep the existing pre-approval system but fix the OAuth linking:**

1. **Remove NextAuth MongoDB Adapter** (eliminate dual user systems)
2. **Use JWT sessions** instead of database sessions  
3. **Custom NextAuth callbacks** handle user lookup in our `User` collection
4. **Preserve all existing functionality**: admin dashboard, user management, profile system

### Benefits:
- ✅ Fixes OAuth linking issue
- ✅ Preserves existing pre-approval system
- ✅ Keeps admin dashboard working
- ✅ Maintains all current user management features
- ✅ Simplifies authentication flow

## Implementation Plan

### Phase 1: Remove NextAuth Adapter ✅
- [ ] Remove `MongoDBAdapter` from auth configuration
- [ ] Switch to JWT session strategy
- [ ] Update auth callbacks to use custom User model

### Phase 2: Update Auth Callbacks ✅
- [ ] Modify `signIn` callback to check custom User collection
- [ ] Update `jwt` callback to include user data
- [ ] Update `session` callback to enrich session with profile data

### Phase 3: Clean Up Collections ✅
- [ ] Remove unused NextAuth collections (`accounts`, `sessions`, `verification_tokens`)
- [ ] Keep custom collections (`users`, `adminusers`, `usercompanypreferences`)

### Phase 4: Test & Validate ✅
- [ ] Test Google OAuth sign-in flow
- [ ] Verify pre-approval system still works
- [ ] Test admin dashboard functionality
- [ ] Validate user profile management

## Technical Requirements

### Environment Variables (No Changes)
```bash
# Keep existing configuration
NEXT_PUBLIC_USE_DEV_AUTH=true  # For development
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### Database Changes
- **Keep**: `users`, `adminusers`, `usercompanypreferences` collections
- **Remove**: `accounts`, `sessions`, `verification_tokens` collections (NextAuth managed)

### Code Changes
- **Update**: `src/lib/auth.development.ts` and `src/lib/auth.production.ts`
- **Remove**: MongoDB adapter references
- **Add**: JWT session handling
- **Test**: Auth callback functionality

## Success Criteria

### Functional Requirements ✅
1. Google OAuth sign-in works without `OAuthAccountNotLinked` error
2. Pre-approval system continues to work (only approved emails can sign in)
3. Admin dashboard remains functional
4. User profile management unchanged
5. Job scouting features work with proper authentication

### Technical Requirements ✅
1. No dual user collection conflicts
2. Clean authentication flow
3. Proper session management
4. Error handling maintained
5. Development/production mode switching works

## Testing Strategy

### Development Testing
- [ ] Test auto-approval with any Google account
- [ ] Verify user auto-creation works
- [ ] Test admin dashboard access

### Production Mode Testing  
- [ ] Test pre-approval requirement
- [ ] Verify rejected users get proper error
- [ ] Test admin user management

## Risk Mitigation

### Backup Plan
- Keep existing auth files as backup before changes
- Test in development first
- Validate each phase before proceeding

### Rollback Strategy
- Restore original auth configuration if needed
- MongoDB collections remain unchanged (safe)
- Environment variables stay the same

## Dependencies

### Current Stack (Keep)
- NextAuth.js
- MongoDB/Mongoose
- Custom User/AdminUser models
- Google OAuth provider

### Remove
- MongoDB adapter for NextAuth
- Database session storage

## Timeline

**Estimated: 1-2 hours**
- Phase 1: 30 minutes
- Phase 2: 45 minutes  
- Phase 3: 15 minutes
- Phase 4: 30 minutes

## Implementation Notes

This approach maintains **100% compatibility** with your existing:
- Pre-approval system
- Admin dashboard  
- User management
- Profile completion flow
- Job scouting features

Only the OAuth linking mechanism changes - everything else stays the same.
