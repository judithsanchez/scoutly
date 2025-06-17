# Company Types for Client Components

This file contains the types and interfaces related to companies that are used in client-side components.

## Overview

In a Next.js application, we need to separate server-side logic (including Mongoose models) from client-side code. This file provides the type definitions and interfaces that client components need without importing Mongoose.

## Types

### WorkModel Enum

Defines the possible work models for a company:

- `FULLY_REMOTE`: Fully remote work
- `HYBRID`: Hybrid work model (mix of remote and in-office)
- `IN_OFFICE`: On-site work model

### ICompany Interface

The main interface for company data, used in client components:

- `companyID`: Unique identifier for the company
- `company`: The company name
- `careers_url`: URL to the company's careers page
- `selector`: CSS selector for scraping
- `work_model`: The company's work model (from WorkModel enum)
- `headquarters`: Location of company headquarters
- `office_locations`: Array of office locations
- `fields`: Array of industry fields
- `openToApplication`: Whether the company is open to applications
- `lastSuccessfulScrape`: Date of last successful scrape
- `isProblematic`: Flag for companies with scraping issues
- `scrapeErrors`: Array of error IDs
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### CreateCompanyInput Interface

Interface specifically for creating a new company:

- Contains all required fields for company creation
- Some fields are optional with default values set on the server

## Usage

Use these types in client components instead of importing from the Mongoose model file:

```tsx
import {ICompany, WorkModel, CreateCompanyInput} from '@/types/company';
```
