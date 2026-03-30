# Plan: Database

## Status: 85% Built

- [x] Drizzle schema (8 tables, all indexes)
- [x] Database client (postgres.js driver)
- [x] Seed script (10 sources)
- [x] Schema pushed to Supabase
- [ ] RLS policies (not yet configured)
- [ ] Supabase MCP integration

## Goal

Set up Supabase PostgreSQL with Drizzle ORM. Define the schema for articles, users,
preferences, queues, and analytics.

## Architecture Decisions

- **Supabase** for hosted PostgreSQL + Auth + dashboard
- **Drizzle ORM** for type-safe queries (not Supabase JS client for data access)
- **Supabase JS client** only for auth operations
- **Row Level Security (RLS)** on user-specific tables
- **Supabase MCP** in Claude Code for direct DB access during development

## Schema

### Global Tables

```sql
sources
├── id              UUID (PK, default gen_random_uuid())
├── name            TEXT NOT NULL (e.g., "Hacker News", "ArXiv cs.AI")
├── slug            TEXT NOT NULL UNIQUE (e.g., "hacker-news")
├── url             TEXT NOT NULL (feed/API URL)
├── type            TEXT NOT NULL ("rss" | "api")
├── icon_url        TEXT (favicon/logo URL)
├── poll_interval   INTEGER NOT NULL DEFAULT 7200 (seconds, default 2 hours)
├── active          BOOLEAN NOT NULL DEFAULT true
├── last_polled_at  TIMESTAMPTZ
├── created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
└── updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()

articles
├── id              UUID (PK, default gen_random_uuid())
├── source_id       UUID NOT NULL (FK → sources.id)
├── title           TEXT NOT NULL
├── url             TEXT NOT NULL UNIQUE (dedupe key)
├── description     TEXT (RSS description/excerpt)
├── author          TEXT
├── published_at    TIMESTAMPTZ
├── fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
├── created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
└── UNIQUE(url)

article_classifications
├── id              UUID (PK)
├── article_id      UUID NOT NULL UNIQUE (FK → articles.id)
├── tags            TEXT[] NOT NULL (e.g., ["llm-release", "open-source"])
├── hook            TEXT NOT NULL (1-line "why you should care")
├── category        TEXT NOT NULL ("research" | "tool" | "industry" | "tutorial" | "opinion")
├── global_score    INTEGER NOT NULL (0-100, general importance)
├── classified_at   TIMESTAMPTZ NOT NULL DEFAULT now()
└── model_version   TEXT NOT NULL (track which AI model classified)

article_summaries
├── id              UUID (PK)
├── article_id      UUID NOT NULL UNIQUE (FK → articles.id)
├── summary         TEXT NOT NULL (AI-generated full summary)
├── key_points      TEXT[] (bullet points)
├── generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
└── model_version   TEXT NOT NULL
```

### Per-User Tables

```sql
user_profiles (extends Supabase auth.users)
├── id              UUID (PK, FK → auth.users.id)
├── display_name    TEXT
├── avatar_url      TEXT
├── onboarded       BOOLEAN NOT NULL DEFAULT false
├── created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
└── updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()

user_preferences
├── id              UUID (PK)
├── user_id         UUID NOT NULL (FK → user_profiles.id)
├── tag             TEXT NOT NULL (e.g., "llm-release")
├── weight          REAL NOT NULL DEFAULT 50 (0-100)
├── updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
└── UNIQUE(user_id, tag)

user_queue
├── id              UUID (PK)
├── user_id         UUID NOT NULL (FK → user_profiles.id)
├── article_id      UUID NOT NULL (FK → articles.id)
├── score           REAL NOT NULL (personalized score)
├── status          TEXT NOT NULL DEFAULT 'pending' ("pending" | "read" | "skipped" | "bookmarked")
├── queued_at       TIMESTAMPTZ NOT NULL DEFAULT now()
├── acted_at        TIMESTAMPTZ (when user read/skipped/bookmarked)
└── UNIQUE(user_id, article_id)

user_actions
├── id              UUID (PK)
├── user_id         UUID NOT NULL (FK → user_profiles.id)
├── article_id      UUID NOT NULL (FK → articles.id)
├── action          TEXT NOT NULL ("view" | "read" | "skip" | "bookmark" | "unbookmark" | "click_source")
├── time_spent_ms   INTEGER (time on article, for "read" actions)
├── created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### Indexes

```sql
-- Fast queue lookups
CREATE INDEX idx_user_queue_user_status ON user_queue(user_id, status);
CREATE INDEX idx_user_queue_user_score ON user_queue(user_id, score DESC);

-- Fast article lookups
CREATE INDEX idx_articles_source_published ON articles(source_id, published_at DESC);
CREATE INDEX idx_articles_url ON articles(url);  -- dedupe checks

-- Fast action analytics
CREATE INDEX idx_user_actions_user_created ON user_actions(user_id, created_at DESC);

-- Classification lookups
CREATE INDEX idx_article_classifications_tags ON article_classifications USING GIN(tags);
```

### Row Level Security (RLS)

```sql
-- user_profiles: users can only read/update their own profile
-- user_preferences: users can only CRUD their own preferences
-- user_queue: users can only see/modify their own queue
-- user_actions: users can only insert/read their own actions
-- articles, sources, article_classifications, article_summaries: readable by all authenticated users
```

## Implementation Steps

1. Set up Supabase project (USER ACTION — see below)
2. Configure Supabase MCP in Claude Code (USER ACTION — see below)
3. Define Drizzle schema in `src/db/schema.ts`
4. Generate and run initial migration
5. Seed the `sources` table with initial 10 sources
6. Set up RLS policies via Supabase dashboard or migration

## User Actions Required

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create account)
2. Click "New Project"
3. Choose organization (or create one)
4. Project name: `dayread`
5. Database password: generate a strong one, save it securely
6. Region: pick closest to you (e.g., `Southeast Asia` if near Singapore)
7. Click "Create new project"
8. Wait for project to provision (~2 minutes)

### 2. Get Credentials

From Supabase dashboard → Settings → API:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **Publishable API key** (was "anon key" in legacy view) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **Secret API key** (was "service_role key" in legacy view) → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

From Supabase dashboard → Settings → Database:
- Copy **Connection string (URI)** → for Drizzle config
- Select "Transaction" mode for connection pooler (Supavisor)

### 3. Configure Supabase MCP in Claude Code

Add to the project's `.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=false&project_ref=YOUR_PROJECT_REF"
    }
  }
}
```

Replace `YOUR_PROJECT_REF` with your project reference ID (visible in the Supabase URL:
`https://supabase.com/dashboard/project/YOUR_PROJECT_REF`).

Claude Code will prompt you to authenticate via browser on first use.

### 4. Set Up Environment Variables

Create `.env.local` with the credentials from step 2. See `.env.example` for the template.
