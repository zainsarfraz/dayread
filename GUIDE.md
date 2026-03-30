# Dayread — Codebase Guide

This file explains the architecture, file structure, and purpose of every module
in the codebase. Use this as a reference when navigating or extending the project.

**Keep this file updated.** When adding new files, modules, or changing architecture,
update the relevant section here.

## Architecture Overview

Dayread is a multi-user AI-powered tech/AI news aggregator built with Next.js (App Router).

### How It Works

```
1. INGESTION (Global, runs every 2 hours via cron)
   External cron → POST /api/cron/poll
     → Polls 10 RSS feeds and APIs for new articles
     → Deduplicates by URL
     → Stores in `articles` table

2. CLASSIFICATION (Global, runs after polling)
   POST /api/cron/classify
     → Finds unclassified articles
     → Sends batches to Gemini AI
     → Gets: category, tags, hook (1-line summary), importance score
     → Stores in `article_classifications` table

3. QUEUE (Per-user)
   User opens /queue
     → System computes personalized score per article:
        score = user_preference_weights × article_tags × global_score × recency
     → Shows sorted queue with spotlight card + compact list

4. READING (Per-user, on demand)
   User clicks article → /article/[id]
     → If no cached summary: calls Gemini to generate one
     → Caches summary in `article_summaries` table
     → Tracks time spent, updates preference weights

5. LEARNING (Per-user, continuous)
   Every read/skip/bookmark action
     → Adjusts user's tag preference weights
     → Future queue ordering reflects updated preferences
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | Full-stack React framework |
| Language | TypeScript (strict) | Type safety |
| Database | Supabase (PostgreSQL) | Hosted DB + Auth |
| ORM | Drizzle ORM | Type-safe SQL queries |
| Auth | Supabase Auth | Google OAuth |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| AI | Google Gemini Flash-Lite | Classification + Summarization |
| RSS | rss-parser | Feed parsing |
| Icons | Lucide React | Icon library |
| Utilities | clsx | Conditional CSS classes |

## File Structure

### Root Files

```
CLAUDE.md           — Instructions for Claude Code (rules, style, commands)
GUIDE.md            — This file. Codebase architecture reference.
package.json        — Dependencies and scripts
tsconfig.json       — TypeScript config (strict, path aliases @/*)
next.config.ts      — Next.js config (image domains for Google avatars)
postcss.config.mjs  — PostCSS config (Tailwind v4 plugin)
drizzle.config.ts   — Drizzle ORM config (loads DATABASE_URL from .env.local)
.env.local          — Environment variables (not committed)
.env.example        — Template for env vars
```

### `src/db/` — Database Layer

```
schema.ts    — Drizzle schema definition for all 8 tables
               Global: sources, articles, article_classifications, article_summaries
               Per-user: user_profiles, user_preferences, user_queue, user_actions
index.ts     — Drizzle client instance (connects to Supabase via postgres.js)
seed.ts      — Script to populate `sources` table with initial 10 news sources
               Run: pnpm tsx src/db/seed.ts
```

**Key schema relationships:**
- `articles` → belongs to `sources` (via source_id)
- `article_classifications` → one-to-one with `articles` (via article_id)
- `article_summaries` → one-to-one with `articles` (via article_id)
- `user_queue` → links `user_profiles` to `articles` (many-to-many with score)
- `user_preferences` → links `user_profiles` to tags (weight per tag)
- `user_actions` → log of every user interaction (read, skip, bookmark, etc.)

### `src/lib/` — Shared Business Logic

#### `src/lib/supabase/` — Auth & Session Management

```
client.ts      — Browser-side Supabase client (for client components)
server.ts      — Server-side Supabase client (for server components, actions, routes)
middleware.ts  — Session refresh + route protection logic
                 Public routes: /, /auth/*
                 Protected routes: /queue, /article/*, /sources, /stats, /settings
                 Redirects: authenticated users on / → /queue
```

#### `src/lib/ingestion/` — Content Ingestion

```
types.ts         — ParsedArticle type (shared shape for all adapters)
normalize-url.ts — URL normalization for deduplication
                   Strips UTM params, trailing slashes, normalizes to https
rss-adapter.ts   — Generic RSS/Atom adapter (uses rss-parser library)
                   Used for: Simon Willison, TLDR AI, The Decoder, TechCrunch,
                   OpenAI Blog, DeepMind Blog, ArXiv
hn-adapter.ts    — Hacker News adapter (Firebase API)
                   Fetches top 50 stories, filters score > 100, returns top 30
hf-adapter.ts    — HuggingFace Daily Papers adapter (REST API)
                   Fetches trending ML/AI papers with community upvotes
reddit-adapter.ts — Reddit adapter (JSON API)
                   Fetches r/LocalLLaMA top posts of the day, filters score > 50
```

#### `src/lib/ai/` — AI Pipeline

```
classify.ts    — Pass 1: Batch classification
                 Sends article titles + descriptions to Gemini
                 Returns: category, tags, hook, global_score per article
                 Batches of 25 articles per API call
summarize.ts   — Pass 2: On-demand summarization
                 Generates 3-5 paragraph summary + key takeaways
                 Called when user opens an article without a cached summary
                 Result cached in article_summaries table
```

### `src/app/` — Next.js App Router Pages

#### Auth Pages (`src/app/(auth)/`)

```
login/page.tsx     — Login page with "Continue with Google" button
                     Client component, calls supabase.auth.signInWithOAuth
callback/route.ts  — OAuth callback handler (GET route)
                     Exchanges auth code for session, redirects to /queue
```

#### App Pages (`src/app/(app)/`) — Protected, require auth

```
layout.tsx              — Shared layout for all authenticated pages
                          Renders NavBar, validates session, redirects if no auth
queue/page.tsx          — Server component: fetches user's pending queue from DB
                          Joins: user_queue + articles + classifications + sources
queue/queue-view.tsx    — Client component: renders the interactive queue UI
                          SpotlightCard (top article) + CompactCards (rest)
                          Handles read/skip/bookmark with optimistic UI + animations
article/[id]/page.tsx   — Server component: fetches article + classification + summary
article/[id]/article-view.tsx — Client component: renders reading experience
                          On-demand summary generation, time tracking,
                          feedback buttons (thumbs up/down)
```

#### API Routes (`src/app/api/`)

```
cron/poll/route.ts      — POST: Poll all active sources for new articles
                          Protected by CRON_SECRET header
                          Runs all source adapters in parallel via Promise.allSettled
                          Deduplicates by URL, updates last_polled_at
cron/classify/route.ts  — POST: Classify unclassified articles via Gemini AI
                          Protected by CRON_SECRET header
                          Batches of 25, stores results in article_classifications
ai/summarize/route.ts   — POST: Generate article summary on demand
                          Requires auth (user session)
                          Checks cache first, generates + caches if missing
action/route.ts         — POST: Record user actions (read, skip, bookmark, feedback)
                          Updates queue status, adjusts preference weights
                          Weight changes: bookmark +5, read +2, skip -1
                          Bonus +1 for reads > 2 minutes
```

### `src/components/` — Shared UI Components

```
layout/nav-bar.tsx  — Top navigation bar
                      Logo + Queue/Stats/Settings links + user avatar dropdown
                      Highlights active route, sign out from dropdown menu
```

### `src/middleware.ts` — Root Middleware

Runs on every request (except static assets and cron endpoints).
Refreshes Supabase auth session and enforces route protection.

## Design System

Defined in `src/app/globals.css` using Tailwind v4's `@theme` directive.

**Colors:** Dark mode primary, warm amber accent (#E8915A), light mode override
**Fonts:** Inter (UI), Newsreader (article content/serif), JetBrains Mono (tags)
**Animations:** fade-in, slide-up, slide-left (skip), slide-right (bookmark), pulse-subtle

Key Tailwind classes used throughout:
- `bg-bg`, `bg-surface`, `bg-surface-hover` — background layers
- `text-text-primary`, `text-text-secondary`, `text-text-tertiary` — text hierarchy
- `text-accent`, `bg-accent`, `hover:bg-accent-hover` — accent color
- `border-border` — subtle borders
- `animate-fade-in`, `animate-slide-left`, etc. — animations

## Data Flow Patterns

### Polling Flow
```
Cron trigger → /api/cron/poll → adapters → articles table → /api/cron/classify → AI → article_classifications table
```

### Reading Flow
```
User opens /queue → server query (joins 4 tables) → sorted by score → client renders cards
User clicks Read → /article/[id] → server fetches article → client requests summary if needed
User leaves article → client POSTs to /api/action (time_spent) → preference weights updated
```

### Preference Learning Flow
```
User action (read/skip/bookmark) → /api/action
  → log to user_actions table
  → update user_queue status
  → fetch article tags from article_classifications
  → adjust user_preferences weights for matching tags
```

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm db:push      # Push schema to Supabase
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio (DB GUI)
```

## Not Yet Built

- **Onboarding page** (`/onboarding`) — interest selection for new users
- **Stats page** (`/stats`) — reading streaks, top topics, analytics
- **Settings page** (`/settings`) — preference sliders, source toggles, theme
- **Queue population** — scoring + inserting articles into user_queue after classification
- **Bookmarks view** — separate tab for bookmarked articles
- **Mobile responsive** — touch gestures for skip/bookmark
