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

## Deprecated Methods

The following methods are deprecated and will be removed in a future version. Use the UserCompanyPreferenceService instead.

### addTrackedCompany (DEPRECATED)

```typescript
static async addTrackedCompany(
    email: string,
    companyId: string,
    ranking: number = 75
): Promise<IUser>
```

**DEPRECATED:** Use `UserCompanyPreferenceService.setCompanyPreference` instead.

### removeTrackedCompany (DEPRECATED)

```typescript
static async removeTrackedCompany(
    email: string,
    companyId: string
): Promise<IUser>
```

**DEPRECATED:** Use `UserCompanyPreferenceService.stopTrackingCompany` instead.

### updateTrackedCompanyRanking (DEPRECATED)

```typescript
static async updateTrackedCompanyRanking(
    email: string,
    companyId: string,
    ranking: number
): Promise<IUser>
```

**DEPRECATED:** Use `UserCompanyPreferenceService.updateCompanyPreference` instead.

## Migration Notes

The deprecated methods now internally use the UserCompanyPreferenceService methods, maintaining backwards compatibility while encouraging migration to the new API. These methods will be removed in a future version once all code has been updated to use the UserCompanyPreferenceService directly.

## Related Models

- User: The primary model this service manages
- UserCompanyPreference: Used by the deprecated methods as the new source of truth for company tracking

## Important Behavior

- **User Creation**: New users are created with no tracked companies. Users must explicitly add companies they want to track using the UserCompanyPreferenceService.
- **Company Tracking**: Company tracking is now managed through the UserCompanyPreference model, not the User model directly.
