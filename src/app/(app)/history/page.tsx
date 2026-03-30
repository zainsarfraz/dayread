/**
 * History page — shows all articles the user has read.
 *
 * Sorted by read date (newest first).
 */

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { userQueue, articles, articleClassifications, sources } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { HistoryView } from './history-view'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const readArticles = await db
    .select({
      queueId: userQueue.id,
      actedAt: userQueue.actedAt,
      articleId: articles.id,
      title: articles.title,
      url: articles.url,
      publishedAt: articles.publishedAt,
      hook: articleClassifications.hook,
      category: articleClassifications.category,
      tags: articleClassifications.tags,
      sourceName: sources.name,
      sourceIcon: sources.iconUrl,
    })
    .from(userQueue)
    .innerJoin(articles, eq(userQueue.articleId, articles.id))
    .innerJoin(articleClassifications, eq(articles.id, articleClassifications.articleId))
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(and(eq(userQueue.userId, user.id), eq(userQueue.status, 'read')))
    .orderBy(desc(userQueue.actedAt))
    .limit(100)

  return <HistoryView items={readArticles} />
}
