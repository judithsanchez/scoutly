# System Patterns

## Architecture Overview

```mermaid
theme dark
flowchart TD
  Client --> Service
  Service --> Model
  Model --> MongoDB[(MongoDB)]

  subgraph Database Layer
    MongoDB
  end

  subgraph Domain Layer
    Model[Company Model]
  end

  subgraph Service Layer
    Service[Company Service]
  end
```

## Design Patterns

### Repository Pattern

- CompanyService acts as a repository
- Encapsulates data access logic
- Provides type-safe CRUD operations
- Centralizes query logic

### Singleton Pattern

- Database connection management
- Single connection instance shared across application

### Enum Pattern

- WorkModel enum for work arrangements
- Ensures type safety
- Provides clear domain vocabulary

## Data Flow Patterns

### Query Operations

```mermaid
theme dark
sequenceDiagram
    participant C as Client Code
    participant S as CompanyService
    participant M as Company Model
    participant DB as MongoDB

    C->>S: Query Request
    S->>M: Mongoose Query
    M->>DB: MongoDB Query
    DB-->>M: Raw Data
    M-->>S: Document Instance
    S-->>C: Typed Response
```

### Write Operations

```mermaid
theme dark
sequenceDiagram
    participant C as Client Code
    participant S as CompanyService
    participant M as Company Model
    participant DB as MongoDB

    C->>S: Write Request
    S->>M: Create/Update
    M->>DB: Save Operation
    DB-->>M: Confirmation
    M-->>S: Updated Document
    S-->>C: Operation Result
```

## Code Organization

### Directory Structure

```
src/
├── config/
│   └── database.ts      # Database configuration
├── models/
│   └── Company.ts       # Company schema and interface
├── services/
│   └── companyService.ts # Business logic and data access
└── scripts/
    └── seedCompanies.ts  # Database seeding
```

## Error Handling Pattern

- Service layer catches and transforms database errors
- Consistent error message format
- Type-safe error handling with TypeScript

## Query Patterns

### Location-based Queries

- Uses $regex for flexible location matching
- Searches both headquarters and office locations
- Case-insensitive matching

### Work Model Queries

- Exact matching using enum values
- Efficient index usage
- Type-safe query parameters

### Field-based Queries

- Array field querying
- Supports multiple fields per company
- Case-sensitive exact matching
