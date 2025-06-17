# Navbar Component (`src/components/Navbar.tsx`)

## Overview

The Navbar component provides global navigation for the Scoutly application. It has two distinct modes:

1. **Homepage Mode**: Displays landing page navigation with "How It Works", "About this Project", "GitHub", and a "Launch Demo" button.
2. **Internal Pages Mode**: Displays app navigation with "Dashboard", "Saved Jobs", "Companies", and a profile icon for accessing user profile.

## Implementation Notes

- **Client Component**: This is a Client Component (`'use client';`) as it uses React hooks for state management.
- **Responsive Design**: Adapts to mobile and desktop views with a hamburger menu for mobile screens.
- **Active State**: Highlights the current page in the navigation menu for better user orientation.
- **Theme Integration**: Supports both light and dark themes through CSS variables and the ThemeToggle component.
- **Mobile Menu Animation**: Includes smooth slide-in animation for the mobile menu with `max-height` transition.
- **Profile Access**: Uses an icon-only approach for profile access to reduce navbar clutter.

## Props

- **onDemoClick**: Optional function to call when the "Launch Demo" button is clicked (only shown on homepage)

## Key Features

### Navigation Logic

- Uses Next.js `usePathname` hook to determine the current page
- Shows different navigation options based on whether the user is on the homepage or internal pages
- Uses `isActive` helper function to highlight the current page in the navigation

### Responsive Design

- Desktop: Full horizontal navigation
- Mobile: Hamburger menu that expands to reveal navigation options
- Smooth animation for mobile menu opening/closing

### Styling

- Uses CSS variables for theming support
- Includes backdrop blur and shadow effects
- Matches the design from the provided nav-bar.md file

### Accessibility

- Proper ARIA labels for buttons
- Semantic HTML structure
- Interactive elements have hover states

## Usage

```tsx
import { Navbar } from '@/components/Navbar';

// For homepage with demo functionality
<Navbar onDemoClick={() => setIsDemoModalOpen(true)} />

// For internal pages (no demo button)
<Navbar />
```

## Future Considerations

- Add support for authentication states (logged in/out)
- Add dropdown menus for additional navigation options
- Implement notifications in the navbar
