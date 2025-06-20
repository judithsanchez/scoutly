# Users API

This API manages user accounts and provides endpoints for registration, retrieval, and profile management.

## Endpoints

### POST `/api/users`

Register a new user or update an existing user's information. New users are created with no tracked companies by default.

**Request Body:**

```json
{
	"email": "user@example.com",
	"cvUrl": "https://example.com/cv.pdf",
	"candidateInfo": {
		// Optional candidate information
	}
}
```

**Response:**

```json
{
	"success": true,
	"user": {
		"_id": "userId",
		"email": "user@example.com",
		"cvUrl": "https://example.com/cv.pdf",
		"candidateInfo": {
			// User's candidate information
		},
		"createdAt": "2025-06-20T12:00:00.000Z",
		"updatedAt": "2025-06-20T12:00:00.000Z"
	},
	"message": "User registered successfully"
}
```

**Note**: New users are created with no tracked companies. Users must explicitly add companies they want to track using the user company preference endpoints.

### GET `/api/users`

Get all registered users with their complete data, including only the companies they are actually tracking and their saved jobs.

**Response:**

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

### POST `/api/users/query`

Get specific users by their email addresses with their complete data, including tracked companies and saved jobs.

**Request Body:**

```json
{
	"emails": ["user1@example.com", "user2@example.com"]
}
```

**Response:**

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

    ]

}

```

## Authentication

These endpoints use server-side authentication. In development mode, fixed emails may be used.

## Error Handling

All endpoints include proper error handling with descriptive error messages. Common errors include:

- `400 Bad Request` - Invalid input data
- `500 Internal Server Error` - Server-side error

All errors are logged with the EnhancedLogger for easier debugging.

## Related Models and Services

- User Model: Stores basic user information
- UserCompanyPreference Model: Stores user preferences for companies (replaces trackedCompanies array in User model)
- SavedJob Model: Stores jobs that users have saved or are tracking
- UserService, UserCompanyPreferenceService, SavedJobService: Services with business logic for these models

## Important Behavior Notes

- **New User Creation**: Users are created with NO tracked companies by default. This is intentional to ensure users explicitly choose which companies to track.
- **Tracked Companies**: The `trackedCompanies` field in API responses only includes companies that the user has explicitly added to their tracking list with `isTracking: true`.
- **Company Preferences**: Users must use the user company preference endpoints to add/remove companies from their tracking list.
```
