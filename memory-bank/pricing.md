# Pricing Analysis Documentation

## Model Pricing (Paid Tier)

### Base Rates

- **Input**: $0.075 per 1M tokens
- **Output**: $0.30 per 1M tokens

## Operation Cost Breakdown

### 1. Initial Job Matching

#### Token Usage per Operation

- **Input Tokens** (approximate):

  - System role prompt: ~200 tokens
  - First selection task template: ~300 tokens
  - Candidate profile: ~500 tokens
  - CV content: ~1,000-2,000 tokens
  - Job listings (per 10 jobs): ~1,000 tokens
  - Total Input: ~3,000-4,000 tokens

- **Output Tokens** (approximate):
  - Structured job matches: ~500-1,000 tokens

#### Cost Calculation (per operation)

- Input cost: (4,000 / 1,000,000) × $0.075 = $0.0003
- Output cost: (1,000 / 1,000,000) × $0.30 = $0.0003
- **Total cost per initial matching**: ~$0.0006

### 2. Deep Dive Analysis

#### Token Usage per Batch (5 jobs)

- **Input Tokens** (approximate):

  - System role prompt: ~200 tokens
  - Job post deep dive template: ~500 tokens
  - Candidate profile: ~500 tokens
  - CV content: ~1,000-2,000 tokens
  - Detailed job descriptions (5 jobs): ~5,000 tokens
  - Total Input: ~7,200-8,200 tokens

- **Output Tokens** (approximate):
  - Detailed analysis per job: ~800 tokens
  - Total for 5 jobs: ~4,000 tokens

#### Cost Calculation (per batch)

- Input cost: (8,200 / 1,000,000) × $0.075 = $0.000615
- Output cost: (4,000 / 1,000,000) × $0.30 = $0.0012
- **Total cost per batch**: ~$0.001815
- **Cost per job**: ~$0.000363

### 3. Total Process Cost Example

For processing 20 initial job listings with 8 matches going to deep dive:

1. Initial Matching:
   - Cost: $0.0006
2. Deep Dive (2 batches):
   - Cost: 2 × $0.001815 = $0.00363
3. **Total Process Cost**: ~$0.004230

## Cost Optimization Strategies

### 1. Batch Processing

- Processing jobs in batches of 5 reduces API calls
- Optimizes token usage through shared context
- Reduces per-job cost through economies of scale

### 2. Input Token Optimization

- Use concise XML formatting for structured data
- Implement efficient prompt templates
- Minimize redundant information in requests

### 3. Output Token Optimization

- Use structured schemas to limit response size
- Focus on essential information in analysis
- Implement efficient JSON structures

## Monthly Cost Estimation

### Example Scenario: 100 Users

Assuming each user processes 50 jobs monthly:

1. Initial Screening (5,000 jobs):

   - Cost: 500 × $0.0006 = $0.30

2. Deep Dive (1,500 matches):

   - Batches needed: 300
   - Cost: 300 × $0.001815 = $0.5445

3. **Total Monthly Cost**: ~$0.8445

### Cost Scaling Factors

1. Number of active users
2. Jobs processed per user
3. Match rate for deep dive analysis
4. Average job description length
5. CV complexity and length

## Usage Monitoring

The system provides detailed cost tracking through:

1. Token usage monitoring
2. Operation counting
3. Batch processing statistics

This enables:

- Cost prediction
- Usage optimization
- Budget planning

## Free Tier Considerations

While using the free tier (`gemini-2.0-flash-lite`):

- No direct token costs
- Limited by request quotas:
  - 30 requests per minute
  - 1,500 requests per day
- Focus on optimizing within these limits

## Recommendations

1. **Cost Efficiency**

   - Optimize batch sizes for deep dive analysis
   - Implement efficient prompt templates
   - Monitor and adjust token usage patterns

2. **Scaling Considerations**

   - Plan for usage growth
   - Monitor approaching limits
   - Implement cost-aware throttling

3. **Budget Planning**
   - Regular usage pattern analysis
   - Predictive cost modeling
   - Usage optimization reviews
