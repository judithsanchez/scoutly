# ✅ COMPLETED - Phase 1, Step 1.1: TDD Migration to UserCompanyPreference

**STATUS: COMPLETED** ✅ (June 20, 2025)

Goal: Make the UserCompanyPreference model the single source of truth for how users track companies. This involves removing the trackedCompanies array from the User model and refactoring all services and APIs to use the new, more scalable model, guided by a Test-Driven Development (TDD) approach.

**Current State**: Users currently track companies via the `trackedCompanies` array on the User model. The UserCompanyPreference model exists but is not being used. We will migrate to the UserCompanyPreference approach for better scalability and automation support.

**Data Migration**: Since we only have test data, we'll start fresh and delete existing tracked company data during this migration.

Part 1: Backend Service Layer (TDD)
We will build the new service from the ground up, starting with tests.

A. Write the Service Tests (Test First)
Action: Create a new test file: src/services/**tests**/userCompanyPreferenceService.test.ts

Goal: Define the expected behavior of our new service before writing any implementation code.

// src/services/**tests**/userCompanyPreferenceService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserCompanyPreferenceService } from '../userCompanyPreferenceService';
import { UserCompanyPreference } from '@/models/UserCompanyPreference';
import { User } from '@/models/User';
import { Company } from '@/models/Company';

// Mock the models
vi.mock('@/models/UserCompanyPreference');
vi.mock('@/models/User');
vi.mock('@/models/Company');

describe('UserCompanyPreferenceService', () => {
beforeEach(() => {
vi.clearAllMocks();
});

it('should create a new preference for a user and company', async () => {
// Test logic to ensure a preference is created correctly.
});

it('should update the rank of an existing preference', async () => {
// Test logic to verify rank updates.
});

it('should update the isTracking status of an existing preference', async () => {
// Test logic to verify toggling tracking on and off.
});

it('should fetch all tracked company preferences for a given user', async () => {
// Test logic to ensure it returns only tracked companies with populated data.
});

it('should throw an error if the user or company does not exist during creation', async () => {
// Test for error handling.
});
});

B. Implement the UserCompanyPreferenceService
Action: Create the file src/services/userCompanyPreferenceService.ts.

Goal: Write the code that satisfies the tests defined above.

// src/services/userCompanyPreferenceService.ts
import { UserCompanyPreference } from '../models/UserCompanyPreference';
import { Company } from '../models/Company';
import { User } from '../models/User';
import mongoose from 'mongoose';

export class UserCompanyPreferenceService {
static async findByUserId(userId: string) {
return UserCompanyPreference.find({ userId, isTracking: true }).populate('companyId');
}

static async upsert(userId: string, companyId: string, data: { rank?: number; isTracking?: boolean }) {
const user = await User.findById(userId);
const company = await Company.findOne({ companyID: companyId });

    if (!user || !company) {
      throw new Error('User or Company not found for preference update.');
    }

    const preference = await UserCompanyPreference.findOneAndUpdate(
      { userId: user._id, companyId: company._id },
      { $set: { ...data, userId: user._id, companyId: company._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return preference;

}
}

Part 2: API Endpoint Layer (TDD)
With the service layer built and tested, we'll apply the same TDD process to the API routes that will expose this functionality.

A. Write the API Endpoint Tests
Action: Create a new test file: src/app/api/user-company-preferences/**tests**/route.test.ts.

Goal: Simulate HTTP requests to our endpoints and assert that they behave correctly.

// src/app/api/user-company-preferences/**tests**/route.test.ts
import { describe, it, expect, vi } from 'vitest';
// ... imports for NextRequest and your service mocks

describe('/api/user-company-preferences', () => {
it('GET should return only tracked companies for the current user', async () => {
// Test that the endpoint returns a 200 OK and the correct data shape.
});

it('POST should create a new preference and return 201 Created', async () => {
// Test creating a new tracked company.
});
});

describe('/api/user-company-preferences/[companyId]', () => {
it('PUT should update the ranking for a specific company', async () => {
// Test updating the rank.
});

it('PUT should allow untracking a company by setting isTracking to false', async () => {
// Test the untrack functionality.
});
});

B. Implement the API Endpoints
Action: Refactor the files under src/app/api/user-company-preferences/ to use the new UserCompanyPreferenceService.

Goal: Make the API tests pass.

// Example for POST in /api/user-company-preferences/route.ts
import { UserCompanyPreferenceService } from '@/services/userCompanyPreferenceService';

export async function POST(req: NextRequest) {
// ... (get user, companyId, rank from request)
await UserCompanyPreferenceService.upsert(user.id, companyId, { rank, isTracking: true });
return NextResponse.json({ success: true }, { status: 201 });
}

// Example for PUT in /api/user-company-preferences/[companyId]/route.ts
export async function PUT(req: NextRequest, { params }: { params: { companyId: string }}) {
const { companyId } = params;
const { rank, isTracking } = await req.json();
// ... (get user)
await UserCompanyPreferenceService.upsert(user.id, companyId, { rank, isTracking });
return NextResponse.json({ success: true });
}

Part 3: Frontend Hook and Final Cleanup
A. Update the useCompanies Hook
File: src/hooks/useCompanies.ts

Action: Update the mutation functions (trackCompany, untrackCompany, updateRanking) to use the newly implemented API endpoints. The logic inside these functions will change, but their signatures should remain the same, so no UI components need to be altered.

// src/hooks/useCompanies.ts

// The function to untrack a company should now call PUT with isTracking: false
async function untrackCompany(companyId: string) {
await fetch(`/api/user-company-preferences/${companyId}`, {
method: 'PUT',
body: JSON.stringify({ isTracking: false }),
// ...
});
}

B. Final Cleanup
Once all tests are passing and the frontend is confirmed to work correctly with the new hook implementation:

Delete the deprecated methods (addTrackedCompany, removeTrackedCompany, updateTrackedCompanyRanking) from src/services/userService.ts.

Delete the entire trackedCompanies array and its sub-schema (TrackedCompanySchema) from the User model in src/models/User.ts.

End State for Step 1.1
After completing this migration:

The User model is lean and no longer holds tracking data.

All user-company relationships are cleanly managed by the UserCompanyPreference model and its dedicated service.

The entire data flow is covered by comprehensive tests, from the service layer to the API endpoints.

The system is robust and ready for the scheduling logic of Phase 2.

---

## ✅ PHASE 1, STEP 1A - COMPLETED SUCCESSFULLY

**Completion Date**: June 20, 2025  
**Status**: ✅ All tests passing, migration fully implemented

### What Was Accomplished:

✅ **Backend Service Layer (TDD)**
- Created comprehensive unit tests for `UserCompanyPreferenceService`
- Implemented `UserCompanyPreferenceService` with full CRUD operations
- All service tests passing

✅ **API Endpoint Layer (TDD)** 
- Created comprehensive API endpoint tests for `/api/user-company-preferences`
- Refactored API endpoints to use new `UserCompanyPreferenceService`
- All API tests passing

✅ **Frontend Hook Integration**
- Verified `useCompanies` hook works with new API endpoints
- No breaking changes to UI components required

✅ **Legacy Code Cleanup**
- Removed deprecated methods from `UserService`
- Removed `trackedCompanies` array and `TrackedCompanySchema` from User model
- Cleaned up all references to legacy tracking system
- Updated `/api/users/profile` to use new model

✅ **Verification**
- All unit tests passing
- All integration tests passing  
- Full test suite verified by user
- System now uses `UserCompanyPreference` as single source of truth

### Key Files Modified:
- `src/services/userCompanyPreferenceService.ts` - New service implementation
- `src/services/__tests__/userCompanyPreferenceService.test.ts` - Service tests
- `src/app/api/user-company-preferences/route.ts` - Main API endpoint
- `src/app/api/user-company-preferences/[companyId]/route.ts` - Dynamic endpoint  
- `src/app/api/user-company-preferences/__tests__/route.test.ts` - API tests
- `src/models/User.ts` - Removed legacy trackedCompanies
- `src/services/userService.ts` - Removed deprecated methods
- `src/app/api/users/profile/route.ts` - Updated to use new model

**Ready for Phase 1, Step 1b** ✨
