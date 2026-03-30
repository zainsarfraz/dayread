/**
 * On-demand article summarization — Pass 2 of the AI pipeline.
 *
 * Called when a user opens an article that doesn't have a cached summary.
 * Generates a summary, caches it, and returns it.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { articles, articleSummaries, sources } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { summarizeArticle } from '@/lib/ai/summarize'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { articleId } = await request.json()

  // Check cache first
  const [existing] = await db
    .select()
    .from(articleSummaries)
    .where(eq(articleSummaries.articleId, articleId))
    .limit(1)

  if (existing) {
    return NextResponse.json({
      summary: existing.summary,
      keyPoints: existing.keyPoints,
    })
  }

  // Fetch article details
  const [article] = await db
    .select({
      title: articles.title,
      description: articles.description,
      sourceName: sources.name,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(articles.id, articleId))
    .limit(1)

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  // Generate summary
  const result = await summarizeArticle({
    title: article.title,
    description: article.description,
    sourceName: article.sourceName,
  })

  // Cache it
  await db.insert(articleSummaries).values({
    articleId,
    summary: result.summary,
    keyPoints: result.keyPoints,
    modelVersion: 'gemini-2.0-flash-lite',
  }).onConflictDoNothing()

  return NextResponse.json(result)
}
