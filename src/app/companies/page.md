# Companies Page (`src/app/companies/page.tsx`)

## Overview

This page displays a list of companies that users can track. Users can search, filter, and sort the companies. They can also toggle the tracking status for each company.

## Implementation Notes

- **Client Component**: This page is a Client Component (`'use client';`) as it uses React hooks like `useState` and `useEffect` for managing filters, optimistic UI updates, and component state.
- **Data Fetching**: Company data and tracked company statuses are fetched using the `useCompanies` custom hook. This hook utilizes `@tanstack/react-query` for data fetching, caching, and synchronization.
- **Company Card**: The `CompanyCard` component displays individual company information, a toggle switch to track/untrack the company, and a ranking display with editing capability for tracked companies. It implements optimistic updates for both tracking status and ranking changes.
- **Filtering and Sorting**:
  - Users can filter companies by name (search input), work model (Remote, Hybrid, On-Site), and tracking status.
  - Users can sort companies by name (ascending/descending) and by user-specific ranking (high-to-low/low-to-high).
  - Each company has a user-specific ranking that can be edited via a slider interface.
  - The page defaults to showing tracked companies when they exist, with a visually highlighted toggle.
- **Error Handling**: The `useCompanies` hook includes basic retry logic for fetching data. The `CompanyCard` component reverts optimistic updates if an API call to track/untrack fails.

## Key Components

- **`CompaniesPage` (Default Export)**: The main component that orchestrates the page. It fetches data using `useCompanies`, manages filter state, and renders the layout, `CompanyFilters`, and a list of `CompanyCard` components. It also handles displaying loading and error states for the company list. The page now supports filtering by tracked status and sorting by user-specific ranking, as well as adding new companies.
- **`CompanyCard`**: A component responsible for rendering a single company's details, a toggle to track/untrack it, and a user-specific ranking display with edit capabilities via a slider. It handles optimistic UI updates for both tracking status and ranking changes.
- **`CompanyFilters`**: A component that provides UI elements (search input, work model buttons, tracked only toggle, sort dropdown) for searching, filtering by work model, filtering by tracked status, and sorting the list of companies.
- **`AddCompanyModal`**: A modal component that provides a form for adding new companies to the database, with the option to immediately track them and set a ranking.

## Recent Changes

- Added `'use client';` directive to resolve React Server Components error.
- Correctly integrated `allCompanies` data from the `useCompanies` hook, resolving a `Cannot find name 'allCompanies'` TypeScript error.
- Implemented rendering of the `filteredCompanies` list, including loading, error, and empty states.
- Added UI elements for search, work model filtering, and sorting within the `CompanyFilters` component.
- Added user-specific company ranking display and edit functionality using a slider interface.
- Added "Show Tracked Only" filter to allow users to view only their tracked companies.
- Added sorting options by company ranking (high-to-low and low-to-high).
- Updated the `useCompanies` hook to include a `updateRanking` mutation for modifying company rankings.
- Added "On-Site" filter option for companies with IN_OFFICE work model.
- Added "Add Company" button and modal that allows users to create new companies and optionally track them with a custom ranking.
- Modified the default filter state to show tracked companies by default, with a fallback to showing all companies if the user has no tracked companies yet.
- Enhanced the "Show Tracked Only" toggle with visual highlighting to make it more prominent.
- Added automatic filter behavior that shows tracked companies by default when available, and falls back to showing all companies when no tracked companies exist.

## Status

- **Core Functionality**: Implemented and working.
- **Error Handling**: Basic error handling in place for data fetching and tracking actions.
- **Styling**: Uses Tailwind CSS and CSS variables for theming (light/dark modes).

## Future Considerations

- More robust error display to the user.
- Pagination or infinite scrolling for large lists of companies.
- Visual indicators (like color coding) for ranking values to help users quickly identify high vs low ranked companies.
- Batch ranking updates for multiple companies simultaneously.
- Drag-and-drop interface to reorder tracked companies by ranking.
