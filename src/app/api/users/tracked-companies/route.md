# DEPRECATED - Tracked Companies API

**DEPRECATED: This API is being phased out in favor of `/api/user-company-preferences`**

This API manages tracked companies for a user.

## Endpoints

### GET `/api/users/tracked-companies`

**DEPRECATED** - Use `/api/user-company-preferences` instead.

Returns the companies tracked by the current user.

**Response:**

```json
{
	"companies": [
		{
			"companyID": "companyId1",
			"ranking": 90
		}
	]
}
```

### POST `/api/users/tracked-companies`

**DEPRECATED** - Use `POST /api/user-company-preferences` instead.

Add a company to the user's tracked companies list.

**Request Body:**

```json
{
	"companyId": "companyId1",
	"ranking": 90
}
```

**Response:**

```json
{
	"success": true,
	"companies": [
		{
			"companyID": "companyId1",
			"ranking": 90
		}
	],
	"message": "Company tracked successfully"
}
```

## Migration Guide

Replace all calls to these deprecated endpoints with calls to the new UserCompanyPreference API:

| **Old Endpoint**                                  | **New Endpoint**                                   | **Notes**                                                  |
| ------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| `GET /api/users/tracked-companies`                | `GET /api/user-company-preferences`                | The new endpoint returns more detailed company information |
| `POST /api/users/tracked-companies`               | `POST /api/user-company-preferences`               | The new endpoint uses `rank` instead of `ranking`          |
| `DELETE /api/users/tracked-companies/{companyId}` | `DELETE /api/user-company-preferences/{companyId}` | Same functionality                                         |
| `PUT /api/users/tracked-companies/{companyId}`    | `PUT /api/user-company-preferences/{companyId}`    | The new endpoint uses `rank` instead of `ranking`          |

## Rationale for Deprecation

1. Scalability: The new model allows for more detailed tracking preferences
2. Maintainability: Separating preferences from the User model follows best practices
3. Performance: The new model allows for more efficient querying of tracked companies
4. Extensibility: The new model can be extended with additional preference fields without impacting the User model
