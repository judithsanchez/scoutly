# Users Query API

This API endpoint allows querying for specific users by their email addresses.

## Endpoint

### POST `/api/users/query`

Get specific users by their email addresses with their complete data, including only the companies they are actually tracking and their saved jobs.

## Purpose

This endpoint is designed for scenarios where you need to fetch information for specific users rather than all users. It's more efficient than fetching all users when you only need a subset.

## Request

**Method:** POST
**Content-Type:** application/json

**Request Body for Multiple Users:**

```json
{
	"emails": ["user1@example.com", "user2@example.com"]
}
```

**Request Body for Single User (Complete Data):**

```json
{
	"email": "user@example.com"
}
```

**Fields:**

- `emails` (optional): Array of email addresses for multiple users you want to retrieve
- `email` (optional): Single email address to get complete user data (user info + tracked companies + saved jobs)

**Note:** You must provide either `emails` OR `email`, not both.

## Response

**Success Response for Multiple Users:**

```json
{
	"users": [
		{
			"_id": "userId",
			"email": "user@example.com",
			"cvUrl": "https://example.com/cv.pdf",
			"candidateInfo": {
				// User's candidate information
			},
			"createdAt": "2025-06-20T12:00:00.000Z",
			"updatedAt": "2025-06-20T12:00:00.000Z",
			"trackedCompanies": [
				{
					"_id": "companyId",
					"company": "Example Corp",
					"careers_url": "https://example.com/careers",
					"logo_url": "https://example.com/logo.png",
					"userPreference": {
						"rank": 90,
						"isTracking": true,
						"frequency": "Weekly"
					}
				}
			],
			"savedJobs": [
				{
					"_id": "savedJobId",
					"userId": "userId",
					"jobId": "jobId",
					"companyId": {
						"_id": "companyId",
						"company": "Example Corp"
						// Other company fields
					},
					"status": "applied",
					"notes": "Had a great first interview",
					"createdAt": "2025-06-20T12:00:00.000Z",
					"updatedAt": "2025-06-20T12:00:00.000Z"
				}
			]
		}
	]
}
```

**Success Response for Single User:**

```json
{
	"user": {
		"_id": "userId",
		"email": "user@example.com",
		"cvUrl": "https://example.com/cv.pdf",
		"candidateInfo": {
			// User's candidate information
		},
		"createdAt": "2025-06-20T12:00:00.000Z",
		"updatedAt": "2025-06-20T12:00:00.000Z",
		"trackedCompanies": [
			{
				"_id": "companyId",
				"company": "Example Corp",
				"careers_url": "https://example.com/careers",
				"logo_url": "https://example.com/logo.png",
				"userPreference": {
					"rank": 90,
					"isTracking": true,
					"frequency": "Weekly"
				}
			}
		],
		"savedJobs": [
			{
				"_id": "savedJobId",
				"userId": "userId",
				"jobId": "jobId",
				"companyId": {
					"_id": "companyId",
					"company": "Example Corp"
					// Other company fields
				},
				"status": "applied",
				"notes": "Had a great first interview",
				"createdAt": "2025-06-20T12:00:00.000Z",
				"updatedAt": "2025-06-20T12:00:00.000Z"
			}
		]
	}
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input data (missing or empty emails array)
- `500 Internal Server Error`: Server-side error

## Usage Examples

**Fetch single user with complete data (NEW - recommended):**

```json
{
	"email": "judithv.sanchezc@gmail.com"
}
```

**Fetch single user (legacy method):**

```json
{
	"emails": ["judithv.sanchezc@gmail.com"]
}
```

**Fetch multiple users:**

```json
{
	"emails": ["user1@example.com", "user2@example.com", "user3@example.com"]
}
```

## Authentication

These endpoints use server-side authentication. In development mode, fixed emails may be used.

## Related Services

- UserService: Core user management logic
- UserCompanyPreferenceService: Manages user's company tracking preferences
- SavedJobService: Manages user's saved jobs

## Important Behavior Notes

- **Tracked Companies**: The `trackedCompanies` field only includes companies that the user has explicitly added to their tracking list with `isTracking: true`.
- **New Users**: Users created via the system start with no tracked companies. They must explicitly add companies they want to track.
