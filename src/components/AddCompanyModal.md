# Add Company Modal (`src/components/AddCompanyModal.tsx`)

## Overview

This component provides a modal interface for users to add new companies to the Scoutly database. It allows users to input company details and optionally track the company immediately with a user-defined ranking.

## Implementation Notes

- **Client Component**: This is a Client Component (`'use client';`) as it uses React hooks for managing form state and submissions.
- **Form Validation**: Basic validation is implemented to ensure all required fields are completed before submission.
- **Work Model Options**: Users can select from all available work models defined in the `WorkModel` enum from `@/types/company` (Fully Remote, Hybrid, On-Site).
- **Tracking Integration**: Users can opt to immediately track the newly added company and set an initial ranking via a slider (default: 75).
- **Error Handling**: Error states are managed and displayed to the user if the company creation fails.

## Props

- **isOpen**: Boolean controlling visibility of the modal
- **onClose**: Function to call when the modal should be closed
- **onAddCompany**: Function that handles the company creation process, with tracking preferences, accepts `CreateCompanyInput` from `@/types/company`

## Usage

```tsx
<AddCompanyModal
	isOpen={isAddCompanyModalOpen}
	onClose={() => setIsAddCompanyModalOpen(false)}
	onAddCompany={async (companyData, track, ranking) => {
		// Handle company creation and tracking
	}}
/>
```

## Flow

1. User clicks the "Add Company" button in the Companies page
2. Modal opens with form fields for company information
3. User completes the form, including setting tracking preference and ranking
4. On submission, the component calls `onAddCompany` with the form data and tracking preferences
5. The parent component handles the actual API calls to create the company and track it if requested
6. The modal displays errors if any occur, or closes on successful creation

## Form Fields

- **Company ID**: Unique identifier for the company (required, no spaces)
- **Company Name**: Display name for the company (required)
- **Careers URL**: Link to the company's careers page (required)
- **Work Model**: Selection between Fully Remote, Hybrid, or On-Site (required)
- **Headquarters**: Company's main location (required)
- **Fields/Industries**: Comma-separated list of company industries or domains (required)

## Future Considerations

- More robust validation, particularly for Company ID uniqueness
- Support for additional fields like office locations
- Image/logo upload capability
- Autocomplete or suggestions for fields/industries
