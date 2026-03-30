/**
 * Cron endpoint: Classify unclassified articles using Gemini.
 *
 * Runs after polling. Batch-classifies articles that don't have
 * a row in article_classifications yet.
 */

import { NextResponse } from 'next/server'
import { db } from '@/db'
import { articles, articleClassifications, sources } from '@/db/schema'
import { eq, isNull } from 'drizzle-orm'
import { classifyArticles } from '@/lib/ai/classify'
import { populateQueueForAllUsers } from '@/lib/scoring/populate-queue'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find unclassified articles
  const unclassified = await db
    .select({
      id: articles.id,
      title: articles.title,
      description: articles.description,
      sourceName: sources.name,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .leftJoin(articleClassifications, eq(articles.id, articleClassifications.articleId))
    .where(isNull(articleClassifications.id))
    .limit(100)

  if (unclassified.length === 0) {
    return NextResponse.json({ classified: 0, message: 'No unclassified articles' })
  }

  // Classify in batches of 25
  let totalClassified = 0
  for (let i = 0; i < unclassified.length; i += 25) {
    const batch = unclassified.slice(i, i + 25)
    try {
      const classifications = await classifyArticles(batch)

      for (const c of classifications) {
        await db.insert(articleClassifications).values({
          articleId: c.articleId,
          tags: c.tags,
          hook: c.hook,
          category: c.category,
          globalScore: c.globalScore,
          modelVersion: 'gemini-3-flash-preview',
        }).onConflictDoNothing()
      }

      totalClassified += classifications.length
    } catch (err) {
      console.error(`Classification batch failed:`, err)
    }
  }

  // After classification, populate user queues with new articles
  const queueResult = await populateQueueForAllUsers()

  return NextResponse.json({
    classified: totalClassified,
    total: unclassified.length,
    queue: queueResult,
  })
}
