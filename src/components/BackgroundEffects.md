# Background Implementation

## Overview

This document explains the background effect implementation used across the Scoutly application.

## Implementation Notes

The main background effect is achieved using a combination of:

1. **CSS Classes**: The `background-glows` class in globals.css provides a theme-aware radial gradient effect
2. **Positioning**: Using `fixed inset-0 z-0` ensures the background spans the full viewport and sits behind content
3. **Theme Support**: Different gradient implementations for light and dark modes

## Example Implementation

```tsx
<div className="bg-[var(--page-bg)] text-[var(--text-color)] min-h-screen">
	{/* The background effect */}
	<div className="background-glows fixed inset-0 z-0"></div>

	{/* Main content goes here */}
	<main className="relative z-10">{/* Page content */}</main>
</div>
```

## CSS Implementation

The background effect is defined in globals.css with different styles for light and dark themes:

```css
.background-glows {
	content: '';
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background-color: var(--bg-color);
	transition: background-color 0.3s ease;
	z-index: -1;
	animation: move-glows 25s linear infinite;
	pointer-events: none;
}

/* Light mode gradients */
.light .background-glows,
html:not(.dark) .background-glows {
	background-image: radial-gradient(...);
}

/* Dark mode gradients */
.dark .background-glows,
html.dark .background-glows {
	background-image: radial-gradient(...);
}
```

## Important Notes

- Always use `fixed inset-0 z-0` with the background-glows class to ensure proper positioning
- Set `relative z-10` on the main content container to ensure it appears above the background
- Use the `bg-[var(--page-bg)]` variable on the outermost container to ensure proper theme background color
