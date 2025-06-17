# ApplicationPipeline Component

This document outlines the ApplicationPipeline component, which provides a Kanban-style board for visualizing job application progress.

## Purpose

The ApplicationPipeline component creates a visual representation of job applications grouped by their current status. It allows users to:

1. See all jobs organized by application status
2. Quickly update status via dropdown menu
3. View important job information in a compact format

## Implementation

The component organizes jobs into columns based on their `ApplicationStatus`. Each column represents a different status in the job application workflow.

### Key Features

- **Status Columns**: Jobs are grouped into columns based on their current application status
- **Compact Job Cards**: Simplified job card view optimized for the kanban display
- **Quick Status Updates**: Change job status directly from the card
- **Visual Status Indicators**: Color-coded borders make it easy to identify different statuses

### Technical Details

The component uses:

1. React state management
2. Status sorting based on priority
3. Tailwind CSS for responsive layout and styling
4. Dynamic column generation based on available statuses

## Integration with Dashboard

The ApplicationPipeline is integrated into the main dashboard and can be toggled on/off via the `enableKanbanView` feature flag in the application configuration.

## Future Enhancements

In a future iteration, this component could be enhanced with:

1. Drag and drop functionality (requires react-dnd)
2. Custom column ordering and visibility settings
3. Automatic status transitions based on time elapsed
4. Animation effects for status changes

## Related Components

- `SavedJobCard`: Used in compact "kanban" mode within this component
- `StatusDropdown`: For changing job status
- `StatusBadge`: For visual status indicators
