# User Service

This service handles core user management functionality, including creating, retrieving, and updating user accounts and their tracked company preferences.

**UPDATED (June 2025)**: Simplified to use tracked companies array directly on User model instead of separate UserCompanyPreferences collection.

## Architecture Changes

### Post-Refactor Implementation

- **Simplified Data Model**: Tracked companies stored as array on User model
- **Direct Operations**: No separate collection lookups required
- **Better Performance**: Fewer database queries for user preferences
- **Cleaner API**: Unified user and preference management

## Methods

### Core User Management

#### getOrCreateUser

```typescript
static async getOrCreateUser(
    email: string,
    cvUrl?: string,
    candidateInfo?: IUser['candidateInfo']
): Promise<IUser>
```

Finds a user by email or creates a new user if one doesn't exist. **New users are created with an empty tracked companies array.**

#### getUserByEmail

```typescript
static async getUserByEmail(email: string): Promise<IUser | null>
```

Retrieves a user by their email address, including their tracked companies.

#### getAllUsers

```typescript
static async getAllUsers(): Promise<IUser[]>
```

Retrieves all users in the system with their tracked companies.

### Company Tracking Management

#### addTrackedCompany

```typescript
static async addTrackedCompany(
    userId: ObjectId,
    companyId: string
): Promise<IUser>
```

Adds a company to the user's tracked companies list. Prevents duplicates automatically.

#### removeTrackedCompany

```typescript
static async removeTrackedCompany(
    userId: ObjectId,
    companyId: string
): Promise<IUser>
```

Removes a company from the user's tracked companies list.

#### updateTrackedCompanies

```typescript
static async updateTrackedCompanies(
    userId: ObjectId,
    companyIds: string[]
): Promise<IUser>
```

Replaces the user's entire tracked companies list with the provided array.

#### getTrackedCompanies

```typescript
static async getTrackedCompanies(userId: ObjectId): Promise<string[]>
```

Returns the user's current list of tracked company IDs.

## Data Model

### User Schema (Updated)

```typescript
interface IUser {
	email: string;
	cvUrl?: string;
	candidateInfo?: ICandidateInfo;
	trackedCompanies: string[]; // NEW: Direct array of company IDs
	createdAt: Date;
	updatedAt: Date;
}
```

## Migration Notes

### From UserCompanyPreferences (Legacy)

- **Before**: Separate `usercompanypreferences` collection with complex queries
- **After**: Simple array field on User model with direct operations
- **Benefits**: Fewer queries, better performance, simpler code

### API Impact

- **GET /api/user-company-preferences**: Now uses `getTrackedCompanies()`
- **POST /api/user-company-preferences**: Now uses `addTrackedCompany()`
- **DELETE /api/user-company-preferences/[id]**: Now uses `removeTrackedCompany()`

## Testing

Comprehensive test coverage includes:

- User creation with empty tracked companies
- Adding/removing tracked companies
- Preventing duplicate company tracking
- Error handling for invalid operations

## Related Models

- **User**: The primary model this service manages
- **Company**: Referenced by tracked company IDs
- **SavedJob**: Jobs saved for users based on tracked companies
