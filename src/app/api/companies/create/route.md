# Companies Create API (`/api/companies/create/route.ts`)

## Overview

This API endpoint handles the creation of new companies in the Scoutly database. It validates required fields, checks for duplicate company IDs, and creates a new company record.

## Endpoint

- **URL**: `/api/companies/create`
- **Method**: `POST`
- **Auth Required**: No (In development; should be restricted to authenticated users in production)

## Request Body

```json
{
	"companyID": "unique_company_id",
	"company": "Company Name",
	"careers_url": "https://company-website.com/careers",
	"work_model": "FULLY_REMOTE | HYBRID | IN_OFFICE",
	"headquarters": "City, Country",
	"fields": ["Field 1", "Field 2"],
	"office_locations": [],
	"selector": "",
	"openToApplication": true
}
```

### Required Fields

- `companyID`: Unique identifier for the company (no spaces)
- `company`: Display name of the company
- `careers_url`: URL to the company's job or careers page
- `work_model`: One of the WorkModel enum values (FULLY_REMOTE, HYBRID, IN_OFFICE)
- `headquarters`: The company's headquarters location
- `fields`: Array of industry fields or domains the company operates in

## Response

### Success Response

**Code**: `201 Created`

```json
{
	"success": true,
	"message": "Company created successfully",
	"company": {
		"companyID": "unique_company_id",
		"company": "Company Name"
		// Additional company data...
	}
}
```

### Error Responses

**Condition**: Missing required field

**Code**: `400 Bad Request`

```json
{
	"error": "Missing required field: fieldName"
}
```

**Condition**: Duplicate company ID

**Code**: `400 Bad Request`

```json
{
	"error": "A company with this ID already exists"
}
```

**Condition**: Server error

**Code**: `500 Internal Server Error`

```json
{
	"error": "Error message details"
}
```

## Implementation Notes

- Uses the `CompanyService.createCompany` method for database interactions
- Performs validation of required fields before attempting to create the company
- Checks for existing companies with the same ID to prevent duplicates
- Logs success and error cases using the Logger utility

## Future Considerations

- Add authentication to restrict company creation to authorized users
- Implement more robust validation for company data
- Support bulk company creation
- Add optional fields for more detailed company information
