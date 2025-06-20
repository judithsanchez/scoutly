# User Service

This service handles core user management functionality, including creating, retrieving, and updating user accounts.

## Methods

### getOrCreateUser

```typescript
static async getOrCreateUser(
    email: string,
    cvUrl?: string,
    candidateInfo?: IUser['candidateInfo']
): Promise<IUser>
```

Finds a user by email or creates a new user if one doesn't exist. **New users are created with no tracked companies by default.**

### getUserByEmail

```typescript
static async getUserByEmail(email: string): Promise<IUser | null>
```

Retrieves a user by their email address.

### getAllUsers

```typescript
static async getAllUsers(): Promise<IUser[]>
```

Retrieves all users in the system.

## Related Models

- User: The primary model this service manages

## Important Behavior

- **User Creation**: New users are created with basic user information only.
