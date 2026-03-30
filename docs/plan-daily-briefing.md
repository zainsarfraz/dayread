# Plan: AI-Personalized Daily Briefing

## Status: Planned (not yet started)

## Goal

Replace the formula-only queue with an AI-curated daily briefing that tells users
"here's what matters to YOU today, and here's WHY" based on their actual behavior.

## How It Works

1. Gather today's classified articles for the user
2. Gather user context:
   - Top tags by weight
   - Recent reading history (last 7 days)
   - Bookmarked articles
   - Top sources
3. Send to AI in ONE call per user per day:
   - Tier articles into must-read / scan / skip
   - Write a 2-3 sentence daily briefing
   - For must-reads, write a personal reason why
4. Cache the result for the day

## UI

- Daily briefing paragraph at the top of queue
- "Must Read" section (3-5 articles with personal reasons)
- "Worth a Scan" section (compact cards)
- "Skippable" section (collapsed, expandable)

## AI Prompt Shape

```
USER PROFILE:
- Top interests: [tag weights]
- Recently read: [last 10 titles]
- Bookmarked: [bookmarked titles]
- Top sources: [sources by engagement]

TODAY'S ARTICLES (30):
[{title, tags, hook, global_score, source}...]

Respond as JSON:
{
  "briefing": "2-3 sentence summary",
  "must_read": [{ article_id, personal_reason }],
  "worth_scanning": [article_ids],
  "skippable": [article_ids]
}
```

## Cost

One AI call per user per day. ~3500 tokens per call. Free on Gemini free tier.

## What Changes

- New table: `daily_briefings` (user_id, date, briefing, tiers, generated_at)
- New API: `/api/briefing/generate`
- Queue page: add briefing section above existing queue
- Formula scoring stays as fallback + input signal to AI
