# Technical Context

## Technology Stack

### Database

- MongoDB: Document database
- Mongoose: ODM (Object Data Modeling) for MongoDB
- Connection managed through environment variables

### Development Tools

- TypeScript: For type safety
- ts-node: For running TypeScript scripts directly

## Implementation Details

### Database Configuration (`src/config/database.ts`)

```typescript
// Connection management with error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scoutly';
export const connectDB = async () => { ... }
export const disconnectDB = async () => { ... }
```

### Data Model (`src/models/Company.ts`)

```typescript
// Work model enumeration
enum WorkModel {
	FULLY_REMOTE = 'FULLY_REMOTE',
	HYBRID = 'HYBRID',
	IN_OFFICE = 'IN_OFFICE',
}

// Company interface
interface ICompany extends Document {
	companyID: string;
	company: string;
	careers_url: string;
	selector: string;
	work_model: WorkModel;
	headquarters: string;
	office_locations: string[];
	fields: string[];
}
```

### Service Layer (`src/services/companyService.ts`)

Static methods for database operations:

- CRUD Operations:
  - createCompany
  - getCompanyById
  - updateCompany
  - deleteCompany
  - deleteMany
- Bulk Operations:
  - bulkCreateCompanies
- Specialized Queries:
  - findCompaniesByWorkModel
  - findCompaniesByLocation
  - findCompaniesByField

### Seed System (`src/scripts/seedCompanies.ts`)

- Predefined company data
- Clear existing data functionality
- Bulk insert operation
- npm script: `npm run seed`

## Environment Configuration

Required environment variables:

```env
MONGODB_URI="mongodb://localhost:27017/scoutly"
```

## Type Definitions

- @types/mongoose for TypeScript support
- Custom interfaces and types for company data
- Enum for work model options

## Database Indexes

- companyID: unique index
- work_model: for efficient filtering
- fields: for field-based queries
- headquarters & office_locations: for location searches
