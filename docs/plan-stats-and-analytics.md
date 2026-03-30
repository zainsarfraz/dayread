# Plan: Stats & Analytics

## Goal

Track user reading behavior and display insightful statistics. Help users understand
their reading habits and see trends over time.

## Architecture Decisions

- **All analytics computed from `user_actions` table** — no separate analytics store
- **Server-side aggregation** via SQL queries (Drizzle)
- **No third-party analytics** (Mixpanel, Amplitude, etc.) — keep it simple and private
- **Stats are per-user** — each user sees only their own data

## Tracked Events

Every user interaction is logged to `user_actions`:

| Action | When | Extra Data |
|--------|------|-----------|
| `view` | User opens article detail | — |
| `read` | User marks article as read (or spends >60s) | `time_spent_ms` |
| `skip` | User skips article in queue | — |
| `bookmark` | User bookmarks article | — |
| `unbookmark` | User removes bookmark | — |
| `click_source` | User clicks "Read full article" link | — |

## Stats Dashboard Sections

### 1. Reading Streak

```
🔥 Current streak: 5 days
   Longest streak: 12 days

   [M] [T] [W] [T] [F] [S] [S]
    ●   ●   ●   ●   ●   ○   ○
```

- A "reading day" = at least 1 article marked as read
- GitHub-style contribution grid for the last 12 weeks
- Each cell colored by intensity (0 articles = empty, 1-2 = light, 3-5 = medium, 6+ = dark)

### 2. This Week / This Month Summary

```
This Week              This Month
─────────              ──────────
12 articles read       47 articles read
3 bookmarked           11 bookmarked
28 skipped             95 skipped
~45 min reading        ~3.2 hrs reading
```

### 3. Top Topics

```
Your most-read topics (last 30 days):

1. LLM Releases          ████████████░░  18 articles
2. Coding Tools           ██████████░░░░  14 articles
3. Open Source             ████████░░░░░░  11 articles
4. AI Architecture         ██████░░░░░░░░   8 articles
5. Research Papers         ████░░░░░░░░░░   5 articles
```

- Derived from tags of read articles
- Horizontal bar chart, sorted by count

### 4. Top Sources

```
Sources you read most (last 30 days):

1. Hacker News           ████████████░░  16 articles
2. Simon Willison         ██████████░░░░  12 articles
3. The Decoder            ████████░░░░░░   9 articles
```

- Derived from source of read articles
- Shows which sources provide the most value to this user

### 5. Read Rate

```
Read rate: 32%  (articles read / articles queued)

     100% ┤
      75% ┤
      50% ┤     ╭─╮
      25% ┤ ╭─╮ │ │ ╭─╮ ╭─╮
       0% ┤─╯ ╰─╯ ╰─╯ ╰─╯ ╰─
          W1  W2  W3  W4  W5  W6
```

- Weekly read rate trend (last 6 weeks)
- Simple sparkline or small bar chart

### 6. Reading Time Distribution

```
When you read most:

Morning (6-12)    ████████████████  62%
Afternoon (12-18) ██████░░░░░░░░░░  24%
Evening (18-24)   ████░░░░░░░░░░░░  14%
Night (0-6)       ░░░░░░░░░░░░░░░░   0%
```

- Derived from `created_at` timestamps of read actions
- Helps user understand their habits

## Visual Design

- Clean, minimal charts — no heavy charting library
- Use CSS/SVG for simple visualizations (bars, grids, rings)
- Accent color for positive metrics (articles read, streaks)
- Muted colors for neutral metrics (skipped, total queued)
- Consider using a lightweight chart library only if CSS/SVG gets too complex
  (e.g., `recharts` or `@nivo/bar` for the trend chart)

## Queries

### Reading Streak

```sql
-- Get distinct dates with at least 1 read action
SELECT DISTINCT DATE(created_at) as read_date
FROM user_actions
WHERE user_id = $1 AND action = 'read'
ORDER BY read_date DESC
```

Then compute streak in application code (count consecutive days from today backwards).

### Weekly/Monthly Summary

```sql
SELECT
  action,
  COUNT(*) as count,
  SUM(time_spent_ms) as total_time_ms
FROM user_actions
WHERE user_id = $1
  AND created_at >= $2  -- start of period
  AND created_at < $3   -- end of period
GROUP BY action
```

### Top Topics

```sql
SELECT unnest(ac.tags) as tag, COUNT(*) as count
FROM user_actions ua
JOIN article_classifications ac ON ua.article_id = ac.article_id
WHERE ua.user_id = $1
  AND ua.action = 'read'
  AND ua.created_at >= now() - interval '30 days'
GROUP BY tag
ORDER BY count DESC
LIMIT 10
```

## Implementation Steps

1. Build stats aggregation queries (Drizzle)
2. Build streak calculation logic
3. Build Stats page layout
4. Build streak visualization (contribution grid)
5. Build summary cards (this week / this month)
6. Build top topics bar chart
7. Build top sources bar chart
8. Build read rate trend chart
9. Build reading time distribution chart
10. Add loading states (skeleton)
11. Mobile responsive layout

## User Actions Required

None — this module is fully code-driven. No external setup needed.
