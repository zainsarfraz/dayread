/**
 * Article detail page — full reading experience with AI summary.
 *
 * Shows the article title, source, metadata, AI-generated summary,
 * key takeaways, and a link to the original article.
 */

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { articles, articleClassifications, articleSummaries, sources, userQueue } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { ArticleView } from './article-view'

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [article] = await db
    .select({
      id: articles.id,
      title: articles.title,
      url: articles.url,
      description: articles.description,
      publishedAt: articles.publishedAt,
      sourceName: sources.name,
      sourceIcon: sources.iconUrl,
      hook: articleClassifications.hook,
      category: articleClassifications.category,
      tags: articleClassifications.tags,
      summary: articleSummaries.summary,
      keyPoints: articleSummaries.keyPoints,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .innerJoin(articleClassifications, eq(articles.id, articleClassifications.articleId))
    .leftJoin(articleSummaries, eq(articles.id, articleSummaries.articleId))
    .where(eq(articles.id, id))
    .limit(1)

  if (!article) notFound()

  // Get queue entry for this user + article
  const [queueEntry] = await db
    .select({ id: userQueue.id, status: userQueue.status })
    .from(userQueue)
    .where(and(eq(userQueue.userId, user.id), eq(userQueue.articleId, id)))
    .limit(1)

  return (
    <ArticleView
      article={article}
      userId={user.id}
      queueId={queueEntry?.id}
      queueStatus={queueEntry?.status}
    />
  )
}
