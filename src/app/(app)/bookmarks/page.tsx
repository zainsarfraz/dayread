/**
 * Bookmarks page — shows all bookmarked articles.
 *
 * Sorted by bookmark date (newest first).
 */

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { userQueue, articles, articleClassifications, sources } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { BookmarksView } from './bookmarks-view'

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const bookmarks = await db
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
    .where(and(eq(userQueue.userId, user.id), eq(userQueue.status, 'bookmarked')))
    .orderBy(desc(userQueue.actedAt))

  return <BookmarksView items={bookmarks} />
}
