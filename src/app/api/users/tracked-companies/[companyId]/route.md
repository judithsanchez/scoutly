# Tracked Companies API (`/api/users/tracked-companies/[companyId]/route.ts`)

This API handles operations on specific companies tracked by users, identified by the company ID.

## Endpoints

### DELETE `/api/users/tracked-companies/{companyId}`

Removes a company from a user's tracked companies list.

**Parameters:**

- `companyId` (route parameter): The ID of the company to untrack

**Response:**

- 200 OK: Returns the updated user with the company removed from their tracked companies
- 500 Internal Server Error: If there's an issue with the database or other server error

### PUT `/api/users/tracked-companies/{companyId}`

Updates the ranking of a tracked company for a user.

**Request Body:**

```json
{
	"ranking": 85
}
```

**Parameters:**

- `companyId` (route parameter): The ID of the company to update the ranking for
- `ranking` (request body): The new ranking value (0-100)

**Response:**

- 200 OK: Returns the updated user with the modified company ranking
- 400 Bad Request: If the ranking is not provided in the request body
- 500 Internal Server Error: If there's an issue with the database or other server error

## Development Notes

- Currently using a hardcoded email (`judithv.sanchezc@gmail.com`) for development.
- In production, this should be replaced with authentication to get the current user's email.
