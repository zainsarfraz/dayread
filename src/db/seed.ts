/**
 * Seed script — populates the sources table with initial 10 sources.
 *
 * Run with: pnpm tsx src/db/seed.ts
 * Requires DATABASE_URL in .env.local
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sources } from './schema'

const INITIAL_SOURCES = [
  {
    name: 'HuggingFace Daily Papers',
    slug: 'huggingface-papers',
    url: 'https://huggingface.co/api/daily_papers',
    type: 'api' as const,
    iconUrl: 'https://huggingface.co/favicon.ico',
  },
  {
    name: 'Hacker News',
    slug: 'hacker-news',
    url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    type: 'api' as const,
    iconUrl: 'https://news.ycombinator.com/favicon.ico',
  },
  {
    name: 'Simon Willison',
    slug: 'simon-willison',
    url: 'https://simonwillison.net/atom/everything/',
    type: 'rss' as const,
    iconUrl: 'https://simonwillison.net/favicon.ico',
  },
  {
    name: 'TLDR AI',
    slug: 'tldr-ai',
    url: 'https://tldr.tech/api/rss/ai',
    type: 'rss' as const,
    iconUrl: 'https://tldr.tech/favicon.ico',
  },
  {
    name: 'The Decoder',
    slug: 'the-decoder',
    url: 'https://the-decoder.com/feed/',
    type: 'rss' as const,
    iconUrl: 'https://the-decoder.com/favicon.ico',
  },
  {
    name: 'TechCrunch AI',
    slug: 'techcrunch-ai',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    type: 'rss' as const,
    iconUrl: 'https://techcrunch.com/favicon.ico',
  },
  {
    name: 'OpenAI Blog',
    slug: 'openai-blog',
    url: 'https://openai.com/blog/rss.xml',
    type: 'rss' as const,
    iconUrl: 'https://openai.com/favicon.ico',
  },
  {
    name: 'DeepMind Blog',
    slug: 'deepmind-blog',
    url: 'https://deepmind.google/blog/rss.xml',
    type: 'rss' as const,
    iconUrl: 'https://deepmind.google/favicon.ico',
  },
  {
    name: 'Reddit r/LocalLLaMA',
    slug: 'reddit-locallama',
    url: 'https://www.reddit.com/r/LocalLLaMA/top.json?t=day&limit=50',
    type: 'api' as const,
    iconUrl: 'https://www.reddit.com/favicon.ico',
  },
  {
    name: 'ArXiv cs.AI',
    slug: 'arxiv-csai',
    url: 'http://rss.arxiv.org/rss/cs.AI',
    type: 'rss' as const,
    iconUrl: 'https://arxiv.org/favicon.ico',
  },
]

async function seed() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false })
  const db = drizzle(client)

  console.log('Seeding sources...')

  for (const source of INITIAL_SOURCES) {
    await db
      .insert(sources)
      .values(source)
      .onConflictDoNothing({ target: sources.slug })
  }

  console.log(`Seeded ${INITIAL_SOURCES.length} sources.`)
  await client.end()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
