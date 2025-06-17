# Companies Page (`src/app/companies/page.tsx`)

## Overview

This page displays a list of companies that users can track. Users can search, filter, and sort the companies. They can also toggle the tracking status for each company.

## Implementation Notes

- **Client Component**: This page is a Client Component (`'use client';`) as it uses React hooks like `useState` and `useEffect` for managing filters, optimistic UI updates, and component state.
- **Data Fetching**: Company data and tracked company statuses are fetched using the `useCompanies` custom hook. This hook utilizes `@tanstack/react-query` for data fetching, caching, and synchronization.
- **Company Card**: The `CompanyCard` component displays individual company information and a toggle switch to track/untrack the company. It implements optimistic updates for the tracking status.
- **Filtering and Sorting**:
  - Users can filter companies by name (search input) and work model.
  - Users can sort companies by name (ascending/descending).
  - The ranking filter and sorting by ranking have been removed as per recent updates where companies no longer have a direct ranking property in the primary company data. Tracked companies have a user-specific ranking.
- **Error Handling**: The `useCompanies` hook includes basic retry logic for fetching data. The `CompanyCard` component reverts optimistic updates if an API call to track/untrack fails.

## Key Components

- **`CompaniesPage` (Default Export)**: The main component that orchestrates the page. It fetches data using `useCompanies`, manages filter state, and renders the layout, `CompanyFilters`, and a list of `CompanyCard` components. It also handles displaying loading and error states for the company list.
- **`CompanyCard`**: A component responsible for rendering a single company's details and a toggle to track/untrack it. It handles optimistic UI updates for the tracking status.
- **`CompanyFilters`**: A component that provides UI elements (search input, work model buttons, sort dropdown) for searching, filtering by work model, and sorting the list of companies.

## Recent Changes

- Added `'use client';` directive to resolve React Server Components error.
- Correctly integrated `allCompanies` data from the `useCompanies` hook, resolving a `Cannot find name 'allCompanies'` TypeScript error.
- Implemented rendering of the `filteredCompanies` list, including loading, error, and empty states.
- Added UI elements for search, work model filtering, and sorting within the `CompanyFilters` component.
- Removed ranking-based filtering and sorting from the UI and logic, as company rankings are now user-specific and managed differently.

## Status

- **Core Functionality**: Implemented and working.
- **Error Handling**: Basic error handling in place for data fetching and tracking actions.
- **Styling**: Uses Tailwind CSS and CSS variables for theming (light/dark modes).

## Future Considerations

- More robust error display to the user.
- Pagination or infinite scrolling for large lists of companies.
- Potentially re-introducing a user-specific ranking display or filter if required by product features.
