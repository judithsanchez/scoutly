# User Company Preferences API

This API manages user preferences regarding companies, including tracking status and ranking.

## Endpoints

### GET `/api/user-company-preferences?email=user@example.com`

Returns only the companies that the specified user is actively tracking (where `isTracking: true`).

**Query Parameters:**

- `email` (required): The user's email address

**Response:**

```json
{
	"companies": [
		{
			"_id": "companyId1",
			"company": "Example Corp",
			"careers_url": "https://example.com/careers",
			"logo_url": "https://example.com/logo.png",
			"userPreference": {
				"rank": 90,
				"isTracking": true,
				"frequency": "Weekly",
				"lastUpdated": "2025-06-20T12:00:00.000Z"
			}
		}
	]
}
```

**Note**: This endpoint only returns companies the user has explicitly chosen to track. For new users, this will return an empty array until they add companies to track.

### POST `/api/user-company-preferences`

This endpoint has two modes:

#### Mode 1: Get tracked companies (alternative to GET)

Send only the email to retrieve all tracked companies for that user.

**Request Body:**

```json
{
	"email": "user@example.com"
}
```

**Response:** Same as GET endpoint - returns array of tracked companies.

#### Mode 2: Add or update a company preference

Send email + companyId to add/update a specific company preference.

**Request Body:**

```json
{
	"email": "user@example.com",
	"companyId": "companyId1",
	"rank": 90,
	"isTracking": true
}
```

**Response:**

```json
{
	"success": true,
	"preference": {
		"_id": "preferenceId",
		"userId": "userId",
		"companyId": "companyId1",
		"rank": 90,
		"isTracking": true,
		"createdAt": "2025-06-15T10:30:00.000Z",
		"updatedAt": "2025-06-20T12:00:00.000Z"
	}
}
```

### GET `/api/user-company-preferences/[companyId]`

Returns the preference for a specific company for the current authenticated user.

**Response:**

```json
{
	"preference": {
		"_id": "preferenceId",
		"userId": "userId",
		"companyId": "companyId1",
		"rank": 90,
		"isTracking": true,
		"createdAt": "2025-06-15T10:30:00.000Z",
		"updatedAt": "2025-06-20T12:00:00.000Z"
	}
}
```

### PUT `/api/user-company-preferences/[companyId]`

Update a company preference for the current authenticated user.

**Request Body:**

```json
{
	"rank": 80,
	"isTracking": true
}
```

**Response:**

```json
{
	"preference": {
		"_id": "preferenceId",
		"userId": "userId",
		"companyId": "companyId1",
		"rank": 80,
		"isTracking": true,
		"createdAt": "2025-06-15T10:30:00.000Z",
		"updatedAt": "2025-06-20T12:00:00.000Z"
	}
}
```

### DELETE `/api/user-company-preferences/[companyId]`

Stop tracking a company (sets `isTracking` to false) for the current authenticated user.

**Response:**

```json
{
	"success": true
}
```

## Authentication

All endpoints require authentication via a session. If no valid session exists, the endpoints will return a `401 Unauthorized` response.

## Error Handling

All endpoints include proper error handling with descriptive error messages. Common errors include:

- `401 Unauthorized` - User is not authenticated
- `404 Not Found` - User or company preference not found
- `400 Bad Request` - Invalid input data (e.g., rank out of range)
- `500 Internal Server Error` - Server-side error

All errors are logged with the EnhancedLogger for easier debugging.
