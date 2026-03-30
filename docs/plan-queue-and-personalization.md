# Plan: Queue & Personalization

## Status: 95% Built

- [x] Scoring formula (tag weights x global score x recency)
- [x] Queue population after classification (all users)
- [x] Queue population on onboarding (single user)
- [x] Queue recalculation when settings change
- [x] Preference learning (read +2, bookmark +5, skip -1, deep read +1)
- [x] Onboarding page with 8 interest categories
- [x] Action API (read, skip, bookmark, unbookmark, feedback)
- [ ] Queue cleanup job (auto-archive 14+ day old pending items)

## Goal

Each user gets a personalized reading queue sorted by relevance to their interests.
The system learns from their behavior (reads, skips, bookmarks) and improves over time.

## Architecture Decisions

- **Personalization is math, not AI.** User preference weights × article tags = score.
  No per-user AI calls needed.
- **Queue is materialized.** When new articles arrive, compute scores and insert into
  `user_queue` for each active user. This makes reads fast and sortable.
- **Preference learning is incremental.** Each user action (read, skip, bookmark)
  adjusts tag weights slightly. No batch retraining.
- **Cold start via onboarding.** New users pick 3-5 interest areas to seed preferences.

## Scoring Algorithm

### Personalized Score Formula

```
score = Σ (user_weight[tag] × tag_match) × global_score_multiplier × recency_boost

where:
  user_weight[tag]        = user's preference weight for each tag (0-100, default 50)
  tag_match               = 1 if article has this tag, 0 otherwise
  global_score_multiplier = article.global_score / 100 (0.0-1.0)
  recency_boost           = max(0, 1 - hours_since_published / 168)  (decays over 7 days)
```

### Example

Article tags: `["llm-release", "open-source"]`, global_score: 85
User weights: `{ "llm-release": 80, "open-source": 70, "coding-tool": 90 }`

```
tag_score = (80 × 1) + (70 × 1) = 150
global_multiplier = 85 / 100 = 0.85
recency_boost = 1 - (12 / 168) = 0.93  (12 hours old)

score = 150 × 0.85 × 0.93 = 118.6
```

### Score Normalization

Scores are normalized to 0-100 range per user for display purposes.
Raw scores are used for sorting (higher precision).

## Preference Learning

### Weight Update Rules

```
On READ:
  For each tag on the article:
    weight += 2  (cap at 100)

On BOOKMARK:
  For each tag on the article:
    weight += 5  (cap at 100)

On SKIP:
  For each tag on the article:
    weight -= 1  (floor at 0)

On READ with time_spent > 2 minutes:
  For each tag on the article:
    weight += 1 (bonus for deep reads)
```

Small increments ensure gradual learning. A user would need to consistently skip
a topic ~50 times to fully deprioritize it from the default of 50.

### New Tag Discovery

When an article has a tag the user doesn't have in `user_preferences`:
- Create the preference with default weight 50
- This ensures new topics surface naturally at medium priority

## Queue Population

### When Queue Updates

1. **After classification** — new classified articles get scored and added to all active users' queues
2. **After preference change** — recalculate scores for pending queue items (not read/skipped)

### Queue Population Flow

```
New articles classified
  → For each active user:
      → Fetch user's preference weights
      → For each new article:
          → Calculate personalized score
          → Insert into user_queue with status='pending'
```

### Queue Cleanup

- Articles older than 14 days with status='pending' → auto-archive (remove from queue)
- Keep read/skipped/bookmarked items forever (for analytics)

## Onboarding (Cold Start)

New user's first login → onboarding screen:

```
"What are you most interested in?"

[ ] New LLM releases & benchmarks
[ ] Coding tools & developer experience
[ ] AI research papers
[ ] Open-source AI projects
[ ] AI startups & industry news
[ ] AI safety & policy
[ ] Web development & frameworks
[ ] MLOps & infrastructure
```

Each selection maps to multiple tags with boosted weights:

```
"New LLM releases" → { "llm-release": 80, "benchmark": 70, "model-training": 65 }
"Coding tools"     → { "coding-tool": 80, "developer-tools": 75, "agents": 70 }
etc.
```

Users who skip onboarding get all weights at 50 (neutral — everything shows up equally).

## Queue UI Behavior

### Daily Queue View

- Shows pending articles sorted by score (descending)
- "Today's Pick" — highest-scored article gets spotlight treatment
- User actions on each card:
  - **Read** → opens article detail, marks as read on close
  - **Bookmark** → saves for later, stays accessible in bookmarks
  - **Skip** → card animates away, logged as skip
- Infinite scroll or paginated (20 per page)

### Bookmarks View

- Separate tab/page for bookmarked articles
- Sorted by bookmark date (newest first)
- Can un-bookmark (removes from bookmarks, logged as action)

## Implementation Steps

1. Build scoring function (pure TypeScript, no AI)
2. Build queue population function (runs after classification)
3. Build preference update function (runs on user action)
4. Create onboarding page with interest selection
5. Wire onboarding to seed `user_preferences`
6. Build queue API endpoint (paginated, sorted by score)
7. Build action API endpoints (read, skip, bookmark)
8. Add queue cleanup job (archive old pending items)

## User Actions Required

None — this module is fully code-driven. No external setup needed.
