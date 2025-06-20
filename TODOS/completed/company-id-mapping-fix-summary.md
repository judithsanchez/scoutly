# Company ID Mapping Fix - Summary

## Issue Description

After fixing the initial user/company tracking bug, a new issue appeared when editing company rankings. The error was:

```
Cast to ObjectId failed for value "10up" (type string) at path "companyId" for model "UserCompanyPreference"
```

## Root Cause Analysis

The issue was a mismatch between frontend and backend expectations:

- **Frontend**: Sends `companyID` field (string like "10up") in API calls
- **Backend**: Expected MongoDB `_id` (ObjectId) for preference operations
- **Database Schema**: UserCompanyPreference model stores `companyId` as ObjectId reference

### Where the Mismatch Occurred:

1. Frontend calls `/api/user-company-preferences/10up` (using companyID)
2. Backend receives "10up" as the `companyId` parameter
3. UserCompanyPreferenceService methods try to use "10up" as ObjectId
4. MongoDB throws casting error because "10up" is not a valid ObjectId

## Fix Implementation

### Updated Service Methods

Modified three key methods in `UserCompanyPreferenceService` to handle both ID formats:

1. **`setCompanyPreference()`** - Used when tracking a company
2. **`updateCompanyPreference()`** - Used when updating rankings
3. **`stopTrackingCompany()`** - Used when untracking a company

### The Fix Pattern

Each method now:

1. Uses a helper function `buildCompanyQuery()` to safely handle both ID formats
2. Uses `mongoose.Types.ObjectId.isValid()` to check if the value is a valid ObjectId
3. Searches by both `_id` and `companyID` for ObjectIds, or only `companyID` for strings
4. Extracts the MongoDB `_id` for preference operations
5. Uses the `_id` for all UserCompanyPreference database operations

### Example Fix:

```typescript
// BEFORE (caused casting errors)
const company = await Company.findOne({
    $or: [
        { _id: companyIdOrObjectId }, // This fails when "10up" is passed
        { companyID: companyIdOrObjectId }
    ]
});

// AFTER (safe casting)
private static buildCompanyQuery(companyIdOrObjectId: string) {
    if (mongoose.Types.ObjectId.isValid(companyIdOrObjectId)) {
        return {
            $or: [
                { _id: companyIdOrObjectId },
                { companyID: companyIdOrObjectId }
            ]
        };
    } else {
        return { companyID: companyIdOrObjectId }; // Only search by companyID
    }
}

const company = await Company.findOne(this.buildCompanyQuery(companyIdOrObjectId));
```

## Files Modified

### Backend Services

- **`src/services/userCompanyPreferenceService.ts`**:
  - ✅ `setCompanyPreference()` - Now handles companyID strings
  - ✅ `updateCompanyPreference()` - Now handles companyID strings
  - ✅ `stopTrackingCompany()` - Now handles companyID strings

### Documentation

- **`src/services/userCompanyPreferenceService.md`** - Updated to reflect new API flexibility

## Testing Verification

The fix should resolve all these operations:

1. ✅ **Track Company**: POST `/api/user-company-preferences` with companyID
2. ✅ **Update Ranking**: PUT `/api/user-company-preferences/10up`
3. ✅ **Untrack Company**: DELETE `/api/user-company-preferences/10up`

## Technical Benefits

1. **Frontend Simplicity**: Frontend can use consistent `companyID` field everywhere
2. **Backward Compatibility**: Still accepts MongoDB ObjectIds if passed
3. **Data Integrity**: Still uses proper ObjectId references in database
4. **API Consistency**: All user-company preference endpoints now work consistently

## Before vs After

### Before (Broken):

```
Frontend: "Edit ranking for company 10up"
API Call: PUT /api/user-company-preferences/10up
Backend: Try to find UserCompanyPreference with companyId="10up"
Database: ❌ ERROR - "10up" is not a valid ObjectId
```

### After (Fixed):

```
Frontend: "Edit ranking for company 10up"
API Call: PUT /api/user-company-preferences/10up
Backend: Find Company where companyID="10up", get its _id
Backend: Use that _id to find/update UserCompanyPreference
Database: ✅ SUCCESS - Uses proper ObjectId reference
```

The fix maintains proper database relationships while providing a frontend-friendly API that works with human-readable company identifiers.
