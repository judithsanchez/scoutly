# Admin Dashboard - Implementation Plan

## Goal

Create an admin-only dashboard for monitoring and managing Scoutly's job matching system using existing data sources.

## Admin Access

- Restricted to: `judithv.sanchezc@gmail.com`
- Uses existing NextAuth session system
- Simple email check for admin permissions

## Phase 1: Current Data Dashboard (TDD Approach)

### MVP Features (Using Existing Data)

#### 1. Admin Route Protection

- Middleware/component to check admin email
- Redirect non-admin users
- Admin access indicator

#### 2. System Overview Page (`/admin`)

- Recent pipeline executions (Story Logger)
- Today's token usage summary (TokenUsage)
- Recent scraping activity (CompanyScrapeHistory)
- System health indicators (Log collection)

#### 3. Pipeline Stories Page (`/admin/stories`)

- Recent job scout narratives (Story Logger data)
- Execution timelines and step details
- Success/failure analysis
- AI decision tracking

#### 4. Company Performance Page (`/admin/companies`)

- Scraping success rates per company
- Last successful scrape times
- Error patterns and problematic companies
- Jobs found vs jobs saved ratios

#### 5. Analytics Page (`/admin/analytics`)

- Token usage trends
- Cost per successful job match
- AI efficiency metrics
- User engagement patterns

## Data Sources (Currently Available)

### Story Logger Data

- **Collection**: Story logs from pipeline executions
- **Contains**: Complete narrative of each job scout execution
- **Usage**: Pipeline execution monitoring, AI decision tracking

### Token Usage Tracking

- **Collection**: `TokenUsage`
- **Contains**: Every AI API call with costs, tokens used, operation type
- **Usage**: Cost tracking, usage patterns, efficiency metrics

### Company Scrape History

- **Collection**: `CompanyScrapeHistory`
- **Contains**: When companies were scraped, success/failure, timing
- **Usage**: Company reliability, scraping patterns

### Saved Jobs Data

- **Collection**: `SavedJob`
- **Contains**: Jobs that were successfully matched and saved
- **Usage**: Match success rates, user engagement, job quality

### User Preferences

- **Collection**: `UserCompanyPreference`
- **Contains**: Which users track which companies, ranking preferences
- **Usage**: User behavior, popular companies, preference patterns

### System Logs

- **Collection**: `Log`
- **Contains**: System-wide debugging and operational logs
- **Usage**: Error patterns, system health, performance issues

## TDD Implementation Order

### 1. Admin Protection (Test First)

- Test admin email check utility
- Test admin route protection middleware
- Test non-admin user redirect

### 2. Data Services (Test First)

- Test admin data aggregation services
- Test story logger data retrieval
- Test analytics calculation functions

### 3. Admin Pages (Test First)

- Test admin dashboard components
- Test data visualization components
- Test admin navigation

### 4. Integration (Test First)

- Test complete admin workflow
- Test admin data refresh
- Test error handling

## Future Expansion (Phase 2)

When automation is added:

- Job queue monitoring
- Scheduler status tracking
- Worker performance metrics
- Real-time system monitoring

## Technical Notes

- Uses existing Next.js app router structure
- Leverages current authentication system
- No new dependencies required for MVP
- Responsive design using existing UI components
