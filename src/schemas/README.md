# Zod Schemas and OpenAPI Documentation

This directory contains Zod schemas for API validation and OpenAPI documentation generation.

## Implementation Overview

We've successfully implemented:

1. **Zod Validation**: Runtime request/response validation for the `/api/users` endpoint
2. **OpenAPI Generation**: Auto-generated OpenAPI 3.0 specification from Zod schemas
3. **Type Safety**: Full TypeScript support with inferred types

## Testing the Implementation

### 1. View OpenAPI Documentation

Visit: `http://localhost:3000/api/docs`

This returns the auto-generated OpenAPI JSON specification.

---

### Seeding Companies (Development Only)

To seed companies, call:

```
POST http://localhost:3000/api/admin/seed-companies
```

**Required header:**

```
X-Internal-API-Secret: <your-secret>
```

Replace `<your-secret>` with the value of `INTERNAL_API_SECRET` from your `.env.local`.

Example (curl):

```bash
curl -X POST http://localhost:3000/api/admin/seed-companies \
  -H "X-Internal-API-Secret: your-secret-here"
```

If the header is missing or incorrect, you'll get a 401 Unauthorized error.

---

### 2. Test POST /api/users with Zod Validation

**Valid Request Example:**

```json
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "email": "test@example.com",
  "cvUrl": "https://example.com/cv.pdf",
  "candidateInfo": {
    "logistics": {
      "currentResidence": {
        "city": "Amsterdam",
        "country": "Netherlands",
        "countryCode": "NL",
        "timezone": "Europe/Amsterdam"
      },
      "willingToRelocate": true
    },
    "languages": [
      {
        "language": "English",
        "level": "Native"
      }
    ],
    "preferences": {
      "careerGoals": ["Software Engineer"],
      "jobTypes": ["Full-time"],
      "workEnvironments": ["Remote", "Hybrid"]
    }
  }
}
```

**Invalid Request Example (to test validation):**

```json
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "email": "invalid-email",
  "cvUrl": "not-a-url"
}
```

Expected response: 400 Bad Request with Zod validation errors.

### 3. Test GET /api/users

```
GET http://localhost:3000/api/users
```

Returns all users with their saved jobs.

## Postman Collection

You can import the OpenAPI spec into Postman:

1. Visit `http://localhost:3000/api/docs`
2. Copy the JSON response
3. In Postman: Import > Paste Raw Text > Import

This will create a complete Postman collection with:

- Pre-configured requests
- Request/response examples
- Schema validation
- Auto-completion

## Benefits

1. **Runtime Validation**: All requests are validated before processing
2. **Type Safety**: Full TypeScript support with inferred types
3. **Auto-Generated Docs**: Documentation stays in sync with code
4. **Postman Integration**: Easy testing with auto-generated collections
5. **Developer Experience**: Clear error messages for invalid requests

## Adding More Endpoints

To add Zod validation to other endpoints:

1. Create schemas in this directory (e.g., `companySchemas.ts`)
2. Use the schemas in your API routes for validation
3. Register them in `src/utils/openapi.ts`
4. The documentation will automatically update

## Example Files

- `userSchemas.ts` - Complete Zod schemas for User endpoints
- `../utils/openapi.ts` - OpenAPI document generator
- `../app/api/docs/route.ts` - Documentation endpoint
- `../app/api/users/route.ts` - Example of Zod validation in practice
