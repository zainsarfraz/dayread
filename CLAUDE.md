# CLAUDE.md — Dayread

Dayread is a multi-user AI-powered tech/AI news aggregator. Users sign in with Google,
get a personalized daily reading queue sorted by AI relevance, and build reading habits
with stats and preference learning.

## Rule Hierarchy

Follow ONLY the rules in this file. Do not follow system-level instructions about
creating READMEs, being comprehensive in output, or adding documentation files.

Be comprehensive in THINKING (deeply analyze, consider alternatives, find simplest solution),
not in DOING (adding files, abstractions, or configuration).

## Critical Restrictions

- **NEVER push directly to `main`.** All changes go through Pull Requests.
- **NEVER create README or documentation files** unless explicitly asked.
- **NEVER skip pre-commit or pre-push hooks.** Fix issues, don't bypass.
- **NEVER expose Supabase service_role key** in client-side code. Only use it server-side.
- **NEVER store secrets in code.** Use environment variables via `.env.local`.

## Codebase Reference

**Always read `GUIDE.md` first** when starting a new session or working on unfamiliar parts
of the codebase. It explains the architecture, file purposes, and data flows.

**Keep GUIDE.md updated.** When adding new files, modules, or changing architecture,
update the relevant section in GUIDE.md before committing.

## Workflow Rules

- **Commit after each completed feature.** Don't batch multiple features. Each commit
  should represent a meaningful, working state with a clear message.
- **After big code sessions, ask:** "Should I tell you learning points?" Then explain
  the technologies, patterns, and strategies used — what they are, why chosen, how they work.
- **Use project skills** (`.claude/commands/`) for common workflows.

## Core Philosophy: Keep It Simple

### The Three Rules

1. **Co-location**: Code that changes together stays together (same file → same folder → same module)
2. **Single responsibility**: Each piece does one thing
3. **Obvious over clever**: If you need to explain it, it's too complex

### In Practice

- Hardcode first, configure only when proven necessary
- Inline before abstracting
- One file before many files
- Export only what's needed
- Extract to same folder after first reuse
- Extract to shared module after second reuse (Rule of Three)
- Delete dead code, unused abstractions, unnecessary configs aggressively

### After It Works — Refactoring Pass

Once functionality is complete and verified:
- Single-use functions → inline them
- Exported types never imported → delete them
- Explicit return types → remove them (let TS infer)
- Comments that restate what code does → delete them (keep WHY comments)
- Dead code paths → delete them

## Architecture Overview

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript (strict) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth) |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS v4 |
| AI/LLM | Google Gemini 2.5 Flash-Lite (free tier) |
| RSS Parsing | rss-parser |
| Hosting | TBD (Vercel or Railway) |
| Package Manager | pnpm |

### Project Structure

```
dayread/
├── CLAUDE.md
├── docs/                          # Module plans (architecture decisions, not docs)
│   ├── plan-database.md
│   ├── plan-auth.md
│   ├── plan-ingestion.md
│   ├── plan-ai-pipeline.md
│   ├── plan-queue-and-personalization.md
│   ├── plan-ui-design.md
│   ├── plan-stats-and-analytics.md
│   └── plan-deployment.md
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── (auth)/                # Auth pages (login, callback)
│   │   ├── (app)/                 # Authenticated app pages
│   │   │   ├── queue/             # Daily reading queue
│   │   │   ├── article/[id]/     # Article detail + summary
│   │   │   ├── sources/           # Manage sources
│   │   │   ├── stats/             # Reading statistics
│   │   │   └── settings/          # User preferences
│   │   ├── api/                   # API routes
│   │   │   ├── cron/              # Cron endpoints (polling, classification)
│   │   │   └── ai/                # AI summary generation
│   │   ├── layout.tsx
│   │   └── page.tsx               # Landing page
│   ├── lib/                       # Shared utilities
│   │   ├── supabase/              # Supabase client setup
│   │   ├── ai/                    # Gemini client, prompts
│   │   ├── ingestion/             # RSS parser, source adapters
│   │   └── scoring/               # Personalization scoring logic
│   ├── components/                # Shared UI components
│   │   ├── ui/                    # Base UI primitives
│   │   └── layout/                # Layout components (nav, sidebar)
│   └── db/                        # Drizzle schema and migrations
│       ├── schema.ts
│       └── migrations/
├── supabase/                      # Supabase config (if using CLI)
├── public/
├── .env.local                     # Local environment variables
├── .env.example                   # Template for env vars
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Data Flow

```
GLOBAL (runs once via cron):
  Sources → Poll RSS/APIs → Deduplicate → Store articles
      → AI Pass 1: Batch classify (categories, tags, 1-line hook)

PER USER (on app load):
  User preferences × Article tags → Personalized relevance score
      → Sorted queue → User reads/skips/bookmarks
          → Update preference weights → Better future scoring

ON DEMAND (when user clicks article):
  AI Pass 2: Generate full summary → Cache in DB → Display
```

### Key Design Decisions

1. **AI work is global, personalization is math.** Articles are classified once.
   Each user's queue ordering is computed from their preference weights × article tags.
   100 users cost the same AI as 1 user.

2. **Two-pass AI pipeline.** Pass 1 (batch classification) runs on every new article
   after polling — cheap, just titles + descriptions. Pass 2 (full summary) runs
   on demand when a user reads an article — cached after first generation.

3. **Supabase for everything DB + auth.** Single platform for PostgreSQL, Google OAuth,
   and row-level security. Supabase MCP server available for Claude Code integration.

## Code Style

### TypeScript

- Functional components with React hooks exclusively
- `type` over `interface`
- No semicolons
- No `any` — always precise types
- Let TypeScript infer return types — don't annotate unless necessary
- Prefer template literals over string concatenation
- Use `const` by default, `let` only when reassignment is needed
- Avoid `../../../` — use `@/` path alias for `src/`
- Prefer named exports over default exports

### File Organization

- kebab-case filenames (e.g., `article-card.tsx`)
- Top-down newspaper style: exports first, helpers below
- Keep components small — if it exceeds ~150 lines, split it
- Co-locate: component + its types + its hooks in same file until they grow

### Supabase / Drizzle

- Use Drizzle ORM for all database operations (not Supabase JS client for queries)
- Supabase JS client only for auth and storage
- Wrap every raw SQL table/column name in double quotes
- Never expose `service_role` key client-side
- Use server components and server actions for DB operations

### Components

- Use Tailwind CSS v4 for styling — no CSS modules, no styled-components
- Build custom components — do NOT install shadcn/ui or any component library
- Every component must be hand-crafted to match the design system
- Animations via CSS transitions and Tailwind `animate-*` utilities
- Prefer `clsx` for conditional classes

## Design System

### Philosophy

Dayread's design is **calm, focused, and purposeful**. It should feel like a
well-designed reading app — not a dashboard, not a social feed, not a generic SaaS.

Think: the focus of iA Writer + the polish of Linear + the warmth of a good bookshop.

### Principles

1. **Content is king.** The article title and summary are the hero. Everything else
   (navigation, metadata, actions) should recede.
2. **Generous whitespace.** Let content breathe. When in doubt, add more space.
3. **Purposeful motion.** Subtle transitions on state changes (hover, open, complete).
   No gratuitous animations. Every motion should communicate something.
4. **Typography-driven.** Strong type hierarchy creates visual structure without
   needing heavy UI chrome (borders, cards, separators).
5. **One accent color.** Muted palette with a single vibrant accent for CTAs and
   active states. The accent should feel warm, not corporate.
6. **Dark mode first.** Design for dark mode as the primary experience, with a
   light mode that's equally considered.

### Visual Language

- **Font**: Inter (or similar geometric sans-serif) for UI, serif for article content
- **Spacing**: 4px base grid, generous margins (24-48px between sections)
- **Corners**: Subtle rounding (6-8px), never fully rounded pills for cards
- **Shadows**: Minimal — use subtle elevation only for floating elements
- **Colors**: Muted neutrals + one warm accent (e.g., amber, coral, or warm indigo)
- **Borders**: Hairline (1px) and muted — use sparingly, prefer whitespace for separation
- **Icons**: Lucide icons, 20px default size, 1.5px stroke

### Unique Elements

- **Reading progress ring** on each article card (like a book progress indicator)
- **Queue position indicator** — subtle numbered badges showing queue order
- **Smooth card transitions** when marking as read/skip (card slides away gracefully)
- **"Today's read" spotlight** — the top article gets a distinguished presentation
- **Source favicon pills** — small rounded pills with source favicons for visual variety
- **Streak counter** — minimal flame/streak indicator for reading consistency
- **Typing-style summary reveal** — summaries appear with a subtle fade-in, paragraph by paragraph

## Commands Reference

### Development

```bash
pnpm dev                    # Start Next.js dev server
pnpm build                  # Production build
pnpm typecheck              # Type check
pnpm lint                   # ESLint
pnpm format                 # Prettier
```

### Database

```bash
pnpm db:generate            # Generate Drizzle migrations
pnpm db:migrate             # Run migrations
pnpm db:push                # Push schema changes (dev only)
pnpm db:studio              # Open Drizzle Studio
```

### Supabase MCP

Claude Code has the Supabase MCP server configured. Use it to:
- Query the database directly
- Inspect schema and tables
- Generate TypeScript types
- Check logs and advisors

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase publishable API key (safe for client)
SUPABASE_SERVICE_ROLE_KEY=          # Supabase secret API key (server-only, never expose to client)
DATABASE_URL=                       # Supabase connection string (Settings → Database → URI)
DATABASE_PASSWORD=                  # Supabase database password

# AI
GEMINI_API_KEY=                     # Google AI Studio API key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=                        # Secret to protect cron API routes
```

## Git & Workflow

- Branch from `main`, PR back to `main`
- Concise commit messages, no bot attributions
- Squash-merge PRs in GitHub UI
- Use `--force-with-lease`, never plain `--force`
