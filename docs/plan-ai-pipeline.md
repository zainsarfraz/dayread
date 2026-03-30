# Plan: AI Pipeline

## Status: Complete

- [x] Pass 1: Batch classification (Gemini 3 Flash Preview)
- [x] Pass 2: On-demand summarization with caching
- [x] Classification cron endpoint
- [x] Summarize API endpoint (auth-protected)
- [x] JSON structured output, retry-safe
- [x] Auto-populates user queues after classification

## Goal

Two-pass AI system: (1) batch classify new articles after polling, (2) generate
full summaries on demand when a user reads an article.

## Architecture Decisions

- **Google Gemini 2.5 Flash-Lite** via Google AI Studio (free tier)
- **Pass 1 (classification)**: runs after every poll, processes all unclassified articles in one batch
- **Pass 2 (summarization)**: runs on demand, cached after first generation
- **Structured output** (JSON mode) for reliable parsing
- **Retry with backoff** for rate limit errors

## Pass 1: Batch Classification

### When It Runs

Triggered by `/api/cron/classify` — called automatically after successful polling,
or on its own cron schedule.

### Input

All articles that don't have a row in `article_classifications`:

```sql
SELECT a.id, a.title, a.description, s.name as source_name
FROM articles a
JOIN sources s ON a.source_id = s.id
LEFT JOIN article_classifications ac ON a.id = ac.article_id
WHERE ac.id IS NULL
ORDER BY a.fetched_at DESC
LIMIT 100
```

### Prompt Strategy

Send articles in batches of ~20-30 to minimize API calls. Single prompt:

```
You are an AI/tech news classifier. For each article, provide:
1. category: one of "research", "tool", "industry", "tutorial", "opinion"
2. tags: 2-5 specific tags from this taxonomy:
   - llm-release, coding-tool, ai-architecture, open-source, framework,
     benchmark, ai-safety, ai-policy, startup, funding, product-launch,
     api-update, model-training, inference, fine-tuning, agents,
     multimodal, robotics, hardware, developer-tools, web-dev, mobile,
     data-engineering, mlops, research-paper, explainer, comparison
3. hook: one sentence (max 120 chars) explaining why a tech-savvy developer
   should care about this. Be specific, not generic.
4. global_score: 0-100 importance rating based on:
   - Impact on the AI/tech industry (40%)
   - Novelty (is this genuinely new?) (30%)
   - Practical relevance to developers (30%)

Articles:
[{id, title, description, source}...]

Respond as JSON array matching the input order.
```

### Output Shape

```json
[
  {
    "article_id": "uuid",
    "category": "tool",
    "tags": ["coding-tool", "open-source", "agents"],
    "hook": "New open-source coding agent that outperforms Copilot on SWE-bench",
    "global_score": 85
  }
]
```

### Cost Estimate

- ~30 articles per batch, ~100 tokens per article input = ~3000 input tokens
- ~50 tokens per article output = ~1500 output tokens
- Per batch: ~3000 input + ~1500 output tokens
- Per day (~4 polls, ~120 new articles): ~12,000 input + ~6,000 output tokens
- Per month: ~360K input + ~180K output tokens
- **Gemini Flash-Lite free tier**: 30 requests/minute, plenty for this volume
- **Cost: $0/month** on free tier

## Pass 2: On-Demand Summarization

### When It Runs

When a user opens an article detail page AND no cached summary exists in
`article_summaries`.

### Input

The article's title, description, and (if available) fetched content:

```
Summarize this AI/tech article for a software developer:

Title: {title}
Source: {source_name}
Description: {description}

Provide:
1. summary: A clear 3-5 paragraph summary covering what it is, why it matters,
   and key technical details. Write for a developer who wants to understand
   this quickly without reading the full article.
2. key_points: 3-5 bullet points of the most important takeaways.

Respond as JSON.
```

### Output Shape

```json
{
  "summary": "Multi-paragraph summary...",
  "key_points": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ]
}
```

### Caching

- Summary stored in `article_summaries` after first generation
- Subsequent users requesting the same article get the cached version
- No TTL — summaries don't change (articles don't change)

### Cost Estimate

- Per summary: ~500 input + ~300 output tokens
- Assume 5-10 articles read per day: ~5,000 input + ~3,000 output tokens
- Per month: ~150K input + ~90K output tokens
- **Cost: $0/month** on free tier

## Error Handling

- **Rate limits**: exponential backoff (1s, 2s, 4s), max 3 retries
- **Malformed JSON response**: retry once with stricter prompt
- **Timeout**: 30s for classification, 30s for summarization
- **Free tier exhaustion**: log warning, skip classification until next day
  (articles queue up, get classified on next successful run)

## Tag Taxonomy Management

The tag list is hardcoded in the classification prompt. To add new tags:
1. Add to the prompt's tag list
2. No schema change needed (tags stored as TEXT[])
3. New tags automatically flow into user preferences on first interaction

## Implementation Steps

1. Set up Gemini client (`@google/generative-ai` SDK)
2. Build classification prompt builder (batches articles)
3. Build `/api/cron/classify` route
4. Build summarization prompt builder
5. Build `/api/ai/summarize` route (called from article detail page)
6. Add JSON response parsing with validation
7. Add retry logic with exponential backoff
8. Wire classification to run after successful poll

## User Actions Required

### Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with Google account
3. Click **Get API Key** → **Create API Key**
4. Copy the key
5. Add to `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

The free tier includes:
- 30 requests/minute for Flash-Lite
- No daily token limit (as of 2025)
- More than sufficient for Dayread's volume
