# Dashboard Admin Center Implementation Plan [IN PROGRESS]

**Progress Summary:**

- ✅ Completed: Steps 1-3, most of Step 4, parts of Step 7
- 🔄 In Progress: Parts of Steps 4-7
- ⬜ Pending: Steps 8-10

For detailed progress tracking, see `/TODOS/completed/dashboard-implementation-progress.md`

## Overview

This plan details how to transform the current dashboard into a comprehensive admin center, focusing on job application tracking, company monitoring, and improving the user's job hunting experience.

## Step 1: Update Navigation and Authentication Context ✅

1. ✅ Add authentication context awareness with dev environment bypassing
2. ✅ Implement responsive navigation with active state tracking
3. ✅ Add user profile element in the navigation bar

## Step 2: Revamp "Start New Scout" Functionality ✅

1. ✅ Connect to tracked companies data
2. ✅ Replace static button with dynamic component that displays tracked companies count
3. ✅ Create a modal or slide-over panel for company selection when starting a new scout
4. ✅ Implement logic to filter out already-processed companies

```javascript
// Example logic for Start New Scout button
function StartNewScout({trackedCompanies, onScoutStart}) {
	const availableCompanies = trackedCompanies.filter(
		company =>
			!company.lastScrapedAt ||
			new Date() - new Date(company.lastScrapedAt) > 7 * 24 * 60 * 60 * 1000,
	); // 7 days

	return (
		<button
			onClick={() => onScoutStart(availableCompanies)}
			className="bg-purple-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-all"
			disabled={availableCompanies.length === 0}
		>
			<span className="flex items-center justify-center gap-2">
				<svg>...</svg>
				Start New Scout {availableCompanies.length > 0 &&
					`(${availableCompanies.length})`}
			</span>
		</button>
	);
}
```

## Step 3: Enhance Job Status Tracking System ✅

1. ✅ Expand current job application status system with new states:

   - Want to Apply (existing)
   - Applied (existing)
   - Discarded (existing)
   - Interview Scheduled (new)
   - Technical Assessment (new)
   - Rejected (new)
   - Offer Received (new)
   - Offer Accepted (new)
   - Offer Declined (new)
   - Stale (new - no response after X days)

2. ✅ Create status change timeline tracking for each job
3. ✅ Add visual indicators (colors, icons) for each status
4. ✅ Implement filtering and sorting by status

```typescript
// Update the ApplicationStatus enum
export enum ApplicationStatus {
	WANT_TO_APPLY = 'want_to_apply',
	APPLIED = 'applied',
	INTERVIEW_SCHEDULED = 'interview_scheduled',
	TECHNICAL_ASSESSMENT = 'technical_assessment',
	REJECTED = 'rejected',
	OFFER_RECEIVED = 'offer_received',
	OFFER_ACCEPTED = 'offer_accepted',
	OFFER_DECLINED = 'offer_declined',
	STALE = 'stale',
	DISCARDED = 'discarded',
}

// Status priority for sorting
const statusPriority: Record<ApplicationStatus, number> = {
	[ApplicationStatus.INTERVIEW_SCHEDULED]: 5,
	[ApplicationStatus.TECHNICAL_ASSESSMENT]: 4,
	[ApplicationStatus.WANT_TO_APPLY]: 3,
	[ApplicationStatus.APPLIED]: 2,
	[ApplicationStatus.OFFER_RECEIVED]: 1,
	[ApplicationStatus.STALE]: 0,
	[ApplicationStatus.REJECTED]: -1,
	[ApplicationStatus.OFFER_DECLINED]: -1,
	[ApplicationStatus.OFFER_ACCEPTED]: -2,
	[ApplicationStatus.DISCARDED]: -3,
};
```

## Step 4: Application Pipeline Visualization ✅

1. ✅ Create a Kanban-style board for visualizing job application flow
2. ✅ Implement status changes functionality (via dropdown instead of drag-and-drop)
3. ✅ Add counters for jobs at each stage
4. ⬜ Add calendar integration for interview scheduling

```jsx
// Example Kanban column component
const ApplicationColumn = ({title, jobs, status}) => (
	<div className="flex flex-col rounded-lg bg-slate-800/50 w-64 shrink-0">
		<div className="p-3 border-b border-slate-700">
			<h3 className="font-bold">{title}</h3>
			<div className="text-sm text-slate-400">{jobs.length} jobs</div>
		</div>
		<div className="p-2 flex-1 overflow-y-auto max-h-[500px]">
			{jobs.map(job => (
				<JobCard key={job._id} job={job} />
			))}
		</div>
	</div>
);

// Pipeline component
const ApplicationPipeline = ({jobs}) => {
	// Group jobs by status
	const groupedJobs = groupBy(jobs, 'status');

	return (
		<div className="flex gap-4 overflow-x-auto pb-4">
			<ApplicationColumn
				title="Want to Apply"
				jobs={groupedJobs[ApplicationStatus.WANT_TO_APPLY] || []}
				status={ApplicationStatus.WANT_TO_APPLY}
			/>
			<ApplicationColumn
				title="Applied"
				jobs={groupedJobs[ApplicationStatus.APPLIED] || []}
				status={ApplicationStatus.APPLIED}
			/>
			{/* More columns */}
		</div>
	);
};
```

## Step 5: Revamp "New Matches Found" Section

1. Update definition to show jobs not yet interacted with
2. Add indicators for high-priority matches
3. Implement quick actions (save/discard) directly from list
4. Create filters for match quality and relevance

```javascript
// Logic to determine new matches
const newMatches = allJobs.filter(
	job => job.createdAt > lastLoginDate && !job.status, // No status means no interaction yet
);

// Sort by match quality
newMatches.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
```

## Step 6: Redesign "Latest Scout Report" Section

1. Transform into "Recent Activity Feed"
2. Include system notifications and job status changes
3. Add timeline of recent scouting activities
4. Show insights from recent searches (trending skills, salary ranges)

```jsx
// Activity item component
const ActivityItem = ({activity}) => {
	const getIcon = () => {
		switch (activity.type) {
			case 'scout_completed':
				return <ScoutIcon />;
			case 'status_change':
				return <StatusChangeIcon />;
			case 'new_match':
				return <MatchIcon />;
			// More types
		}
	};

	return (
		<div className="flex items-start gap-3 p-3 border-b border-slate-700">
			<div className="rounded-full p-2 bg-slate-700">{getIcon()}</div>
			<div>
				<p className="font-medium">{activity.title}</p>
				<p className="text-sm text-slate-400">{activity.description}</p>
				<p className="text-xs text-slate-500">
					{formatTimeAgo(activity.timestamp)}
				</p>
			</div>
		</div>
	);
};
```

## Step 7: Enhanced Job Card Display 🔄

1. 🔄 Redesign cards to show more relevant information at a glance (partially implemented)
2. 🔄 Add priority indicators based on match quality (suitability score implemented)
3. ⬜ Include skill match visualization
4. ✅ Add quick action buttons for status updates

```jsx
const SavedJobCard = ({job}) => {
	const getStatusColor = status => {
		switch (status) {
			case ApplicationStatus.WANT_TO_APPLY:
				return 'border-yellow-400';
			case ApplicationStatus.APPLIED:
				return 'border-blue-400';
			case ApplicationStatus.INTERVIEW_SCHEDULED:
				return 'border-purple-400';
			case ApplicationStatus.OFFER_RECEIVED:
				return 'border-green-400';
			case ApplicationStatus.REJECTED:
				return 'border-red-400';
			case ApplicationStatus.STALE:
				return 'border-gray-400';
			default:
				return 'border-slate-400';
		}
	};

	return (
		<div
			className={`card border border-l-4 ${getStatusColor(
				job.status,
			)} rounded-2xl p-5`}
		>
			<div className="flex justify-between items-start mb-2">
				<div className="flex-grow">
					<h3 className="text-lg font-bold">{job.title}</h3>
					<p className="text-sm text-muted">{job.company}</p>
				</div>
				<div className="text-2xl font-bold text-green-500">
					{job.suitabilityScore}%
				</div>
			</div>
			<div className="flex flex-wrap gap-2">
				{job.skills.map(skill => (
					<span
						key={skill}
						className="tag text-xs font-medium px-2.5 py-1 rounded-full"
					>
						{skill}
					</span>
				))}
			</div>
			<div className="mt-3 flex justify-end gap-2">
				{/* Quick action buttons */}
			</div>
		</div>
	);
};
```

## Step 8: Create Custom Dashboard Sections

1. Implement "Priority Applications" section showing jobs user wants to apply to
2. Add "Upcoming Interviews" section with timeline view
3. Create "Recent Rejections" section with feedback tracking
4. Add "Job Market Insights" based on user's search patterns

## Step 9: Add Data Visualization Components

1. Create application funnel chart showing conversion rates
2. Implement response rate visualization by company
3. Add skill match radar chart
4. Create time-to-response metrics

## Step 10: Dashboard Customization

1. Allow reordering of dashboard components
2. Implement collapsible sections
3. Add dark/light theme persistence
4. Create mobile-optimized view for all components

## Implementation Timeline

### Phase 1: Core Functionality (Weeks 1-2) ✅

- ✅ Update ApplicationStatus enum and related models
- ✅ Revamp job card components
- ✅ Implement Start New Scout with company tracking

### Phase 2: Enhanced Visualization (Weeks 3-4) 🔄

- ✅ Build application pipeline Kanban view
- 🔄 Create activity feed (in progress)
- 🔄 Implement match quality indicators (partially implemented with suitability score)
- ✅ Add status change tracking

### Phase 3: Advanced Features (Weeks 5-6) ⬜

- ⬜ Implement data visualizations
- ⬜ Add customization options
- ⬜ Create mobile-optimized views
- ⬜ Finalize comprehensive dashboard

## Technical Considerations

- ✅ Use React Context for managing global application state
- ✅ Implement custom hooks for data fetching and caching
- ✅ Use Tailwind CSS for responsive design
- ⬜ Consider using Framer Motion for smooth transitions

## Dev Authentication Note ✅

For development purposes, we'll implement a bypass for authentication to make testing easier. This can be achieved by:

1. ✅ Creating a development-only context provider that simulates an authenticated user
2. ✅ Adding an environment flag (e.g., NEXT_PUBLIC_SKIP_AUTH) to toggle this behavior
3. ✅ Documenting this behavior clearly in the codebase

---

# Design Preview

<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoutly - Redesigned Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        html { scroll-behavior: smooth; }
        body {
            font-family: 'Inter', sans-serif;
            transition: background-color 0.3s ease, color 0.3s ease;
            overflow-x: hidden;
        }

        /* --- Theme Color System --- */
        :root {
            --bg-color: #f1f5f9;      /* slate-100 */
            --card-bg: white;
            --card-border: #e2e8f0;    /* slate-200 */
            --text-color: #0f172a;    /* slate-900 */
            --text-muted: #475569;    /* slate-600 */
            --tag-bg: #e2e8f0;       /* slate-200 */
            --nav-bg: rgba(255, 255, 255, 0.7);
            --nav-border: #e2e8f0;
            --toggle-icon-color: #475569;
            --snippet-bg: #f8fafc;    /* slate-50 */
        }
        .dark {
            --bg-color: #020617;      /* slate-950 */
            --card-bg: #0f172a;      /* slate-900 */
            --card-border: #1e293b;   /* slate-800 */
            --text-color: #f1f5f9;    /* slate-100 */
            --text-muted: #94a3b8;    /* slate-400 */
            --tag-bg: #1e293b;       /* slate-800 */
            --nav-bg: rgba(15, 23, 42, 0.7);
            --nav-border: rgba(255, 255, 255, 0.2);
            --toggle-icon-color: #cbd5e1;
            --snippet-bg: #020617;    /* slate-950 */
        }

        body { background-color: var(--bg-color); color: var(--text-color); }
        .card { background-color: var(--card-bg); border-color: var(--card-border); }
        .text-muted { color: var(--text-muted); }
        .tag { background-color: var(--tag-bg); }
        .nav-card { background-color: var(--nav-bg); border-color: var(--nav-border); }
        .toggle-icon { color: var(--toggle-icon-color); }
        .snippet-bg { background-color: var(--snippet-bg); }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
    </style>

</head>
<body>
    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 px-4 mt-4 z-40">
        <div class="nav-card mx-auto p-3 rounded-2xl border shadow-lg backdrop-blur-xl max-w-7xl">
            <div class="flex justify-between items-center">
                <a href="#" class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600 dark:text-purple-400"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>
                    <span class="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white">Scoutly</span>
                </a>

                <div class="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
                    <a href="#dashboard" class="text-purple-600 dark:text-purple-400 font-semibold">Dashboard</a>
                    <a href="#" class="hover:text-[var(--text-color)] transition-colors">Saved Jobs</a>
                    <a href="#" class="hover:text-[var(--text-color)] transition-colors">Profile</a>
                </div>

                <div class="flex items-center gap-2">
                    <button id="theme-toggle" class="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors" aria-label="Toggle theme">
                        <svg id="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5 hidden"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
                        <svg id="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
                    </button>
                     <!-- Mobile Menu Button -->
                    <button class="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-500/10 dark:bg-white/10 hover:bg-slate-500/20 dark:hover:bg-white/20 transition-colors" aria-label="Open menu">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toggle-icon h-5 w-5"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <main id="dashboard" class="px-4 pb-24 pt-28 md:pt-32">
        <div class="max-w-7xl mx-auto">

            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight">Command Center</h1>
                <button class="mt-4 sm:mt-0 w-full sm:w-auto bg-purple-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10c0-4.42-2.87-8.1-6.84-9.48"></path><path d="M12 2a10 10 0 1 0 10 10c0-4.42-2.87-8.1-6.84-9.48"></path><circle cx="12" cy="12" r="2"></circle><path d="M12 12h.01"></path><path d="M22 12h-2"></path><path d="M6 12H4"></path><path d="m15.5 15.5.7.7"></path><path d="m8.5 8.5.7.7"></path><path d="m15.5 8.5-.7.7"></path><path d="m8.5 15.5-.7.7"></path></svg>
                    Start New Scout
                </button>
            </div>

            <!-- Stat Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div class="card border rounded-2xl p-5 fade-in" style="animation-delay: 0.1s;">
                    <h3 class="font-semibold text-muted mb-2">New Matches Found</h3>
                    <p class="text-4xl font-bold text-green-500">8</p>
                </div>
                <div class="card border rounded-2xl p-5 fade-in" style="animation-delay: 0.2s;">
                    <h3 class="font-semibold text-muted mb-2">Saved Jobs</h3>
                    <p class="text-4xl font-bold">12</p>
                </div>
                 <div class="card border rounded-2xl p-5 fade-in" style="animation-delay: 0.3s;">
                    <h3 class="font-semibold text-muted mb-2">Application Pipeline</h3>
                    <p class="text-4xl font-bold">4</p>
                </div>
                <div class="card border rounded-2xl p-5 fade-in" style="animation-delay: 0.4s;">
                    <h3 class="font-semibold text-muted mb-2">Companies Tracked</h3>
                    <p class="text-4xl font-bold">25</p>
                </div>
            </div>

            <!-- Main Content: Feed -->
            <div class="space-y-8">
                <div>
                    <h2 class="text-2xl font-bold mb-4">Latest Scout Report</h2>
                    <div class="card border rounded-2xl p-6 space-y-4 fade-in" style="animation-delay: 0.5s;">
                         <div class="flex flex-col sm:flex-row justify-between items-start">
                             <div>
                                <h3 class="text-lg font-bold">Scout for "Ashby"</h3>
                                <p class="text-sm text-muted">Completed just now &bull; 2 new matches found</p>
                             </div>
                             <a href="#" class="mt-3 sm:mt-0 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">View Full Report</a>
                         </div>
                         <div class="border-t border-[var(--card-border)] pt-4 flex flex-col sm:flex-row gap-4">
                            <!-- Job Match Snippet -->
                            <div class="flex-1 snippet-bg p-4 rounded-lg">
                                <p class="font-bold">All-around Ashby Expert</p>
                                <p class="text-sm text-muted">Ashby &bull; 95% Match</p>
                            </div>
                            <div class="flex-1 snippet-bg p-4 rounded-lg">
                                <p class="font-bold">Software Engineer, Frontend</p>
                                <p class="text-sm text-muted">Ashby &bull; 88% Match</p>
                            </div>
                         </div>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold">Recently Saved Jobs</h2>
                        <a href="#" class="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">View All</a>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Redesigned SavedJobCard -->
                        <div class="card border border-l-4 border-l-yellow-400 rounded-2xl p-5 fade-in" style="animation-delay: 0.6s;"><div class="flex justify-between items-start mb-2"><div class="flex-grow"><h3 class="text-lg font-bold">Senior Frontend Engineer</h3><p class="text-sm text-muted">Stripe</p></div><div class="text-2xl font-bold text-green-500">92%</div></div><div class="flex flex-wrap gap-2"><span class="tag text-xs font-medium px-2.5 py-1 rounded-full">React</span><span class="tag text-xs font-medium px-2.5 py-1 rounded-full">Next.js</span></div></div>
                        <div class="card border border-l-green-400 rounded-2xl p-5 fade-in" style="animation-delay: 0.7s;"><div class="flex justify-between items-start mb-2"><div class="flex-grow"><h3 class="text-lg font-bold">Product Engineer</h3><p class="text-sm text-muted">GitBook</p></div><div class="text-2xl font-bold text-green-500">75%</div></div><div class="flex flex-wrap gap-2"><span class="tag text-xs font-medium px-2.5 py-1 rounded-full">TypeScript</span><span class="tag text-xs font-medium px-2.5 py-1 rounded-full">Node.js</span></div></div>
                    </div>
                </div>
            </div>

        </div>
    </main>

    <script>
        const themeToggle = document.getElementById('theme-toggle');
        const sunIcon = document.getElementById('theme-icon-sun');
        const moonIcon = document.getElementById('theme-icon-moon');
        const docElement = document.documentElement;

        function applyTheme(theme) {
            if (theme === 'dark') {
                docElement.classList.add('dark');
                docElement.classList.remove('light');
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            } else {
                docElement.classList.remove('dark');
                docElement.classList.add('light');
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            }
        }
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = docElement.classList.contains('dark') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    </script>

</body>
</html>
