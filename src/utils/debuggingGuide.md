# AI Job Matching Debugging Guide

This guide provides comprehensive tools and techniques for debugging the AI job matching pipeline in Scoutly, particularly when jobs are not being matched or saved as expected.

## 🚀 Quick Start - Debugging a Missing Match

If you notice that jobs from a specific company (like Booking.com) are not appearing in your saved jobs, follow these steps:

### 1. Check Recent AI Decisions

```bash
npm run analyze-ai-decisions your-email@example.com
```

This will show you:

- How many jobs were rejected by the AI in the last 7 days
- The main categories of rejection (visa, language, experience, etc.)
- Specific reasons for each rejection
- Company-specific rejection patterns

### 2. Monitor Live Decision Making

```bash
npm run monitor-ai-decisions -- --user your-email@example.com
```

This will show real-time AI decisions as they happen, including:

- Detailed rejection information for each job
- Deal-breaker analysis (visa, language, location issues)
- Batch processing summaries
- Score distributions

### 3. Clear Data and Re-test

```bash
# Clear previous scraping history and saved jobs for clean testing
npm run reset-for-testing your-email@example.com

# Then trigger a new job search to see fresh results
```

## 📊 Analysis Tools

### AI Decision Analyzer (`analyzeAIDecisions.ts`)

**Purpose**: Analyzes historical AI decisions to identify patterns in job rejections.

**Usage**:

```bash
# Analyze all users for last 7 days
npm run analyze-ai-decisions

# Analyze specific user for last 7 days
npm run analyze-ai-decisions user@example.com

# Analyze specific user for last 14 days
npm run analyze-ai-decisions user@example.com 14
```

**What it shows**:

- Total rejected jobs
- Deal-breaker categories (visa sponsorship, language requirements, experience mismatches, etc.)
- Most common rejection reasons with examples
- Company-specific rejection patterns
- Actionable insights and recommendations

### Live AI Monitor (`monitorAIDecisions.ts`)

**Purpose**: Real-time monitoring of AI job matching decisions as they happen.

**Usage**:

```bash
# Monitor all activity
npm run monitor-ai-decisions

# Monitor specific user
npm run monitor-ai-decisions -- --user user@example.com

# Hide accepted jobs, show only rejections
npm run monitor-ai-decisions -- --no-accepted

# Custom polling interval (default is 5 seconds)
npm run monitor-ai-decisions -- --interval 10
```

**What it shows**:

- Live AI rejections with detailed breakdown
- Deal-breaker analysis in real-time
- Batch processing summaries
- Score distributions for completed analyses

## 🔍 Understanding AI Rejection Reasons

The AI uses a structured decision-making process based on the prompt template in `src/config/jobPostDeepDive.md`. Here are the main rejection categories:

### 1. Deal-Breaker: Work Authorization & Location

- **Rule**: If job is outside EU and no visa sponsorship mentioned → Automatic rejection (score: 0)
- **Common patterns**: US/UK jobs without explicit visa support
- **Fix**: Target EU companies or companies that explicitly mention visa sponsorship

### 2. Deal-Breaker: Language Requirements

- **Rule**: If job requires fluency in languages not in candidate profile → Automatic rejection
- **Candidate languages**: Spanish, English, Dutch
- **Common patterns**: Jobs requiring German, French, Italian, etc.
- **Fix**: Apply to jobs that match your language skills or consider learning additional languages

### 3. Deal-Breaker: Experience Level Mismatch

- **Rule**: If switching domains (e.g., web dev to mobile), AI treats candidate as junior in new domain
- **Example**: Senior web developer applying for senior mobile developer role → AI may reject or downgrade
- **Fix**: Target roles in your primary domain (web development) or accept junior-level roles in new domains

### 4. Tech Stack Mismatch

- **Rule**: AI evaluates overlap between candidate's proven skills and job requirements
- **Scoring**: Major tech stack differences lower suitability score
- **Fix**: Target roles that match your primary technology stack

### 5. Timezone & Remote Work

- **Rule**: Significant timezone mismatches (>4-5 hours) are flagged as issues
- **Fix**: Look for "timezone flexible" or "async work" mentions in job descriptions

## 🛠️ Enhanced Logging Features

### Frontend Logging

- **Location**: Dashboard page (`src/app/dashboard/page.tsx`)
- **Captures**: API calls, user actions, error contexts
- **Destination**: Sent to backend logging API

### Backend Logging

- **Location**: Throughout pipeline steps and AI processor
- **Captures**: Detailed AI decisions, rejection reasons, deal-breaker analysis
- **Enhanced features**:
  - Individual job rejection details
  - Tech stack analysis
  - Location/visa status tracking
  - Language requirement evaluation

### Log Storage

- **Database**: MongoDB `logs` collection
- **Structure**: Structured JSON with context, levels, and timestamps
- **Retention**: Configurable (default: indefinite for debugging)

## 📋 Common Scenarios & Solutions

### Scenario 1: "No jobs from Booking.com despite tracking them"

**Debugging steps**:

1. Run `npm run analyze-ai-decisions your-email@example.com`
2. Look for Booking.com in company rejection patterns
3. Check rejection reasons - likely visa sponsorship or experience level
4. **Expected result**: Booking.com jobs are being scraped but rejected by AI due to location (Netherlands) without explicit visa sponsorship for non-EU candidates

### Scenario 2: "Too many jobs getting rejected"

**Debugging steps**:

1. Run analysis tool to see rejection categories
2. If >30% are visa-related: Focus on EU companies or those mentioning visa support
3. If >20% are experience-related: AI may be correctly filtering overly senior/junior roles
4. If >10% are language-related: Verify job language requirements match your skills

### Scenario 3: "Want to see AI decisions as they happen"

**Solution**: Use the live monitor during a job search session:

```bash
npm run monitor-ai-decisions -- --user your-email@example.com
```

### Scenario 4: "Suspect AI is too strict"

**Investigation**:

1. Review the prompt template in `src/config/jobPostDeepDive.md`
2. Check if deal-breaker logic is appropriate for your situation
3. Consider if criteria need adjustment (this would require code changes)

## 🔧 Data Management Tools

### Reset for Testing

```bash
npm run reset-for-testing your-email@example.com
```

Clears both scraping history and saved jobs for clean testing.

### Clear Scraping History Only

```bash
npm run clear-scrape-history your-email@example.com
```

Allows re-scraping companies without losing saved jobs.

### Debug User Data

```bash
npm run debug-user your-email@example.com
```

Shows comprehensive user data including profile, companies, and recent activity.

## 💡 Tips for Effective Debugging

### 1. Use Sequential Approach

1. Start with historical analysis (`analyze-ai-decisions`)
2. Clear data and re-test (`reset-for-testing`)
3. Monitor live decisions (`monitor-ai-decisions`)
4. Analyze new patterns

### 2. Focus on Patterns

- Look for consistent rejection reasons across companies
- Identify if specific deal-breakers are affecting multiple jobs
- Check if rejection rate is abnormally high (>80%)

### 3. Validate Pipeline Health

- Ensure jobs are being scraped (check scraping logs)
- Verify AI is analyzing jobs (check batch processing logs)
- Confirm duplicate prevention is working (saved jobs should not duplicate)

### 4. Check Edge Cases

- Very short job descriptions (may lack context for AI)
- Jobs in unusual formats or languages
- Companies with complex application processes

## 🔮 Advanced Debugging

### Custom Log Queries

The logs are stored in MongoDB and can be queried directly for complex analysis:

```javascript
// Find all AI rejections for a specific company
db.logs.find({
	message: /AI rejected/,
	'context.rejections.url': /booking\.com/,
});

// Find patterns in consideration points
db.logs.aggregate([
	{$match: {message: /AI rejected/}},
	{$unwind: '$context.rejections'},
	{$unwind: '$context.rejections.considerationPoints'},
	{
		$group: {
			_id: '$context.rejections.considerationPoints',
			count: {$sum: 1},
		},
	},
	{$sort: {count: -1}},
]);
```

### Performance Analysis

Monitor token usage and rate limiting:

```bash
# Check recent pipeline performance
grep -i "rate limit\|token usage" logs/*.log

# Monitor pipeline step timing
grep -i "step completed" logs/*.log
```

## 📞 Support

If the debugging tools don't reveal the issue:

1. **Check the specific prompt templates** in `src/config/` - they define AI behavior
2. **Review rate limiting** - jobs might be skipped due to API limits
3. **Verify user profile completeness** - incomplete profiles may cause issues
4. **Consider AI model changes** - Gemini model updates might affect matching behavior

The enhanced logging should provide visibility into exactly why jobs are being rejected, making it much easier to understand and potentially adjust the matching criteria.
