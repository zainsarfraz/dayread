/**
 * Cron endpoint: Poll all active sources for new articles.
 *
 * Each source is capped to a reasonable number of articles per poll
 * to avoid flooding the database with low-signal content.
 */

import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sources, articles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { pollRss } from '@/lib/ingestion/rss-adapter'
import { pollHackerNews } from '@/lib/ingestion/hn-adapter'
import { pollHuggingFace } from '@/lib/ingestion/hf-adapter'
import { pollReddit } from '@/lib/ingestion/reddit-adapter'
import { normalizeUrl } from '@/lib/ingestion/normalize-url'

// Max articles to insert per source per poll
const SOURCE_CAPS: Record<string, number> = {
  'arxiv-csai': 20,
  'deepmind-blog': 20,
  'huggingface-papers': 30,
  'hacker-news': 25,
  'simon-willison': 20,
  'techcrunch-ai': 15,
  'tldr-ai': 10,
  'the-decoder': 15,
  'openai-blog': 10,
  'reddit-locallama': 15,
}

const DEFAULT_CAP = 20

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activeSources = await db
    .select()
    .from(sources)
    .where(eq(sources.active, true))

  const results = await Promise.allSettled(
    activeSources.map(async (source) => {
      const adapter = getAdapter(source.slug)
      const parsed = await adapter(source.url)
      const cap = SOURCE_CAPS[source.slug] ?? DEFAULT_CAP
      const capped = parsed.slice(0, cap)

      let inserted = 0
      for (const item of capped) {
        const normalizedUrl = normalizeUrl(item.url)
        try {
          await db.insert(articles).values({
            sourceId: source.id,
            title: item.title,
            url: normalizedUrl,
            description: item.description,
            author: item.author,
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
          }).onConflictDoNothing({ target: articles.url })
          inserted++
        } catch {
          // Duplicate URL — skip
        }
      }

      await db
        .update(sources)
        .set({ lastPolledAt: new Date() })
        .where(eq(sources.id, source.id))

      return { source: source.slug, fetched: parsed.length, capped: capped.length, inserted }
    }),
  )

  const summary = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return { source: activeSources[i]?.slug, error: String(r.reason) }
  })

  return NextResponse.json({ polled: activeSources.length, results: summary })
}

function getAdapter(slug: string) {
  switch (slug) {
    case 'hacker-news':
      return pollHackerNews
    case 'huggingface-papers':
      return pollHuggingFace
    case 'reddit-locallama':
      return pollReddit
    default:
      return pollRss
  }
}
