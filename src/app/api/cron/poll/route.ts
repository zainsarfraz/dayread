/**
 * Cron endpoint: Poll all active sources for new articles.
 *
 * Called every 2 hours by external cron (GitHub Actions or Vercel Cron).
 * Protected by CRON_SECRET. After polling, triggers classification.
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

export async function POST(request: Request) {
  // Verify cron secret
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

      let inserted = 0
      for (const item of parsed) {
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

      // Update last polled timestamp
      await db
        .update(sources)
        .set({ lastPolledAt: new Date() })
        .where(eq(sources.id, source.id))

      return { source: source.slug, fetched: parsed.length, inserted }
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
