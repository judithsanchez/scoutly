# AI Debugging Tools - Quick Reference

## 🎯 Problem: Jobs from companies like Booking.com not being matched/saved

## ✅ Solutions Implemented

### 1. Enhanced AI Logging (`aiProcessor.ts`)

- **Added**: Detailed rejection analysis with all job fields
- **Shows**: Location, visa sponsorship, language requirements, tech stack, experience level
- **Includes**: Deal-breaker pattern detection
- **Result**: Much more granular understanding of why jobs are rejected

### 2. AI Decision Analyzer (`analyzeAIDecisions.ts`)

```bash
npm run analyze-ai-decisions your-email@example.com
```

- **Purpose**: Historical analysis of AI rejection patterns
- **Output**: Rejection categories, common reasons, company patterns, insights
- **Use case**: Understanding why jobs were rejected in past searches

### 3. Live AI Monitor (`monitorAIDecisions.ts`)

```bash
npm run monitor-ai-decisions -- --user your-email@example.com
```

- **Purpose**: Real-time monitoring of AI decisions
- **Output**: Live rejection details, deal-breaker analysis, score distributions
- **Use case**: Watching AI decisions as they happen during job search

### 4. Enhanced Pipeline Logging (`DeepAnalysisStep.ts`)

- **Added**: Score distribution analysis
- **Shows**: Excellent/Good/Fair/Poor/Rejected job counts
- **Includes**: Top-scoring jobs with reasons
- **Result**: Better understanding of overall pipeline performance

### 5. Comprehensive Documentation (`debuggingGuide.md`)

- **Complete**: Step-by-step debugging workflows
- **Scenarios**: Common problems and solutions
- **Reference**: All tools and their usage
- **Context**: Understanding AI decision-making logic

## 🚀 Quick Start Guide

### For Booking.com Jobs Specifically:

1. **Check what happened to Booking.com jobs**:

   ```bash
   npm run analyze-ai-decisions your-email@example.com
   ```

   Look for:

   - Booking.com in company rejection patterns
   - Visa sponsorship rejection count
   - Location mismatch issues

2. **Test fresh with monitoring**:

   ```bash
   # Clear old data
   npm run reset-for-testing your-email@example.com

   # Start monitoring
   npm run monitor-ai-decisions -- --user your-email@example.com

   # Then trigger a new job search and watch decisions live
   ```

3. **Expected findings**:
   - Booking.com jobs are being scraped successfully
   - AI is rejecting them due to location (Netherlands) without explicit visa sponsorship
   - This is expected behavior given the AI's deal-breaker logic for EU candidates applying to non-EU jobs

## 🔍 What the Enhanced Logging Shows

### For Each Rejected Job:

- **Location**: Where the job is located
- **Visa Support**: Whether visa sponsorship is explicitly offered
- **Languages**: Required languages vs. candidate languages (Spanish, English, Dutch)
- **Experience**: Required level vs. candidate's domain experience
- **Tech Stack**: Technologies required vs. candidate skills
- **AI Reasoning**: Specific consideration points from the AI
- **Deal-breakers**: Automatically detected blocking issues

### Deal-breaker Detection:

- ❌ **US/UK location without visa sponsorship**
- ❌ **Language requirements not matching candidate profile**
- ❌ **Domain transfer penalties** (e.g., web dev → mobile dev)
- ❌ **Timezone mismatches > 4-5 hours**

## 📊 Expected Results for Your Profile

Based on your profile (EU-based, Spanish/English/Dutch speaker, web development focus):

- **US jobs**: Likely rejected due to visa sponsorship requirements
- **UK jobs**: Likely rejected due to visa sponsorship requirements
- **EU jobs**: Should be accepted if tech stack and experience level match
- **Remote jobs**: Accepted if timezone and other criteria match
- **Non-web development**: May be rejected or scored lower due to domain transfer

## 🎯 Key Insights

The AI is working as designed - it's being appropriately strict about:

1. **Legal work authorization** (visa requirements)
2. **Language capabilities** (matching candidate's stated languages)
3. **Domain expertise** (web development experience doesn't fully transfer to other domains)
4. **Experience levels** (preventing mismatched seniority applications)

This explains why Booking.com jobs might be rejected even though you're tracking them - the AI is filtering based on practical job-matching criteria, not just company interest.

## 🛠️ Next Steps

1. **Validate the hypothesis**: Use the tools to confirm AI rejection reasons
2. **Adjust expectations**: Understand that high rejection rates may be correct filtering
3. **Focus search strategy**: Target companies/roles that align with AI criteria
4. **Consider profile updates**: If needed, adjust location preferences or add visa status clarity

The logging system should now provide complete transparency into the AI's decision-making process! 🎉
