# dayread

AI-powered tech & AI news aggregator. Pulls from 10 sources, classifies every article with AI, and serves a personalized daily reading queue that learns from your behavior.

## What it does

- **Polls** Hacker News, ArXiv, HuggingFace, TechCrunch, Reddit, Simon Willison, The Decoder, DeepMind, OpenAI, and TLDR AI every 2 hours
- **Classifies** every article with Gemini AI — tags, category, importance score, and a 1-line hook
- **Personalizes** your queue using preference weights that update from your reads, skips, and bookmarks
- **Summarizes** articles on demand with AI — cached after first generation

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Supabase** (PostgreSQL + Google OAuth)
- **Drizzle ORM**
- **Tailwind CSS v4**
- **Google Gemini** (classification + summarization)

## Getting started

```bash
pnpm install
cp .env.example .env.local  # fill in your credentials
pnpm db:push                # push schema to Supabase
pnpm tsx src/db/seed.ts     # seed sources
pnpm dev                    # start dev server
```

See `GUIDE.md` for full architecture docs and `docs/` for module plans.
