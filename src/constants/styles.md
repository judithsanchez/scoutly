# Styling Constants

This file documents the shared styling constants used throughout the application. The goal is to maintain a consistent look and feel across all pages while making it easy to update styling globally.

## Background Styling

The application uses a consistent background styling pattern across all pages. This consists of three main components:

1. `PAGE_BACKGROUND_CONTAINER`: The outermost container with base background color and text color
2. `PAGE_BACKGROUND_GLOW`: The glowing effect layer that provides depth
3. `PAGE_CONTENT_CONTAINER`: The main content area with proper positioning and padding

### Implementation Pattern

```tsx
<div className={PAGE_BACKGROUND_CONTAINER}>
	<div className={PAGE_BACKGROUND_GLOW}></div>
	<main className={PAGE_CONTENT_CONTAINER}>{/* Page content goes here */}</main>
</div>
```

## Typography

We use consistent typography styles throughout the application:

- `HEADING_LG`: Large page headings
- `HEADING_MD`: Medium section headings
- `TEXT_PRIMARY`: Primary text color
- `TEXT_SECONDARY`: Secondary/muted text color

## Layout

Common layout helpers:

- `MAIN_CONTAINER`: Standard page container
- `CARD_CONTAINER`: Card-style container for content blocks
- `FLEX_CENTER`: Centered flex container
- `FLEX_BETWEEN`: Flex container with space between items
- `FLEX_COL`: Vertical flex container

## Buttons

Standard button styles:

- `BUTTON_PRIMARY`: Primary action buttons
- `BUTTON_SECONDARY`: Secondary action buttons
- `BUTTON_OUTLINE`: Outline-style buttons for tertiary actions

## Best Practices

1. Always import styling constants from `@/constants/styles`
2. Use the background styling pattern consistently across all pages
3. Avoid duplicating styles in components - use the constants instead
4. When adding new pages, follow the same background structure
5. For page-specific styles that won't be reused, define them within the component
