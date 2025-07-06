# Pattern: Map Email to User ID in API Endpoints

## Why?

- **Consistency:** Most data models use `userId` as the foreign key, not email.
- **Security:** User IDs are less likely to leak PII than emails.
- **Performance:** Indexes on userId are more efficient for lookups.
- **Flexibility:** Users can change their email, but userId remains stable.

## What to do

- For any endpoint that receives an email (e.g., as a query param or in the body), **first look up the user by email**.
- Use the resulting user's `_id` (userId) for all further queries, mutations, or associations.
- Never store or query by email in sub-collections (e.g., SavedJob, Applications, etc.) unless absolutely necessary.

## Example Implementation

### Before

```ts
// BAD: Directly querying by email in SavedJob collection
const jobs = await SavedJob.find({userEmail: email}).lean();
```

### After

```ts
// GOOD: Map email to userId, then query by userId
const userArr = await User.find({email}).lean();
const user = Array.isArray(userArr) ? userArr[0] : userArr;
if (!user) {
	// handle not found
}
const userIdStr =
	typeof user._id === 'object' && user._id instanceof mongoose.Types.ObjectId
		? user._id.toString()
		: String(user._id);
const jobs = await SavedJob.find({userId: userIdStr}).lean();
```

## Where to Apply

- All endpoints that accept an email and need to fetch or mutate user-related data in other collections.
- GET, POST, PATCH, DELETE, etc.

## Migration Steps

1. **Update all endpoints** to use this pattern.
2. **Remove any userEmail fields** from sub-collections if not needed.
3. **Document this pattern** for future contributors.

## Benefits

- Prevents bugs when users change their email.
- Ensures all data is consistently linked by userId.
- Makes codebase more maintainable and secure.

---

_Last updated: 2025-07-06_
