# Constants Directory

This directory contains shared constants used throughout the application. The goal is to centralize commonly used values to promote consistency and make updates easier.

## File Structure

- **common.ts** - Common values like default user email, company rankings, etc.
- **styles.ts** - Styling class names and tailwind combinations for consistent UI
- **applicationStatus.ts** - Constants related to application status values and display
- **config.ts** - Application configuration including API endpoints, routes, and feature flags
- **index.ts** - Exports all constants from a single entry point

## Usage

Import constants from the central location:

```typescript
// Import specific constants
import {DEFAULT_USER_EMAIL} from '@/constants/common';
import {HEADING_LG, FLEX_COL} from '@/constants/styles';

// Or import everything via the index file
import {DEFAULT_USER_EMAIL, HEADING_LG} from '@/constants';
```

## Environment Variables

Some constants rely on environment variables. For client-side access in Next.js, remember:

1. Use `NEXT_PUBLIC_` prefix for any variable that needs to be accessed in browser/client components
2. Add variables to `.env.local` for local development (never commit to version control)
3. Example: `NEXT_PUBLIC_DEV_USER_EMAIL=dev@scoutly.app`

## Adding New Constants

When adding new constants:

1. Group related constants in the appropriate file
2. Use UPPER_CASE for simple primitive values
3. Use camelCase for objects or complex values
4. Add JSDoc comments to explain the purpose and usage
5. Update the exports in index.ts file

## Best Practices

- Avoid hardcoding values in components - add them to constants instead
- Use descriptive names that explain the purpose of the constant
- Group related constants together
- Provide fallback values for environment-dependent constants
