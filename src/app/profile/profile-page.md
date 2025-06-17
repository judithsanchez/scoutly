# Profile Page (`src/app/profile/page.tsx`)

## Overview

The Profile Page allows users to view and update their profile information, including CV, location, language skills, and job preferences.

## Implementation Notes

- **Client Component**: This is a Client Component (`'use client';`) as it uses React hooks for state management and form handling.
- **Theme Integration**: Fully supports both light and dark themes through CSS variables, ensuring consistent display in both modes.
- **Modular Design**: The page is organized into distinct sections for different types of profile information.

## Key Features

### Form Organization

- Structured into logical sections: Authentication, CV URL, Logistics, Languages, and Preferences
- Each section is visually separated using themed card components

### State Management

- Uses React useState for local state management
- Includes form saving simulation with visual feedback
- Manages complex nested state for user preferences and qualifications

### Styling

- Uses CSS variables for theming support to ensure consistency in both light and dark modes
- Responsive design that adapts to different screen sizes
- Consistent styling with the rest of the application

### User Experience

- Provides visual feedback for form submission
- Clean and organized layout for complex information
- Intuitive form controls for different data types

## Future Considerations

- Add real API integration for saving profile data
- Implement form validation for input fields
- Add CV upload functionality
- Consider breaking the form into smaller, more manageable components
