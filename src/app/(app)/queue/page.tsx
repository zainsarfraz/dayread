/**
 * Queue page — the core experience.
 *
 * On load: populates queue with any new classified articles,
 * then shows the personalized reading queue sorted by relevance.
 */

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { userQueue, articles, articleClassifications, sources } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { populateQueueForUser } from '@/lib/scoring/populate-queue'
import { QueueView } from './queue-view'

export default async function QueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Populate queue with any new classified articles for this user
  await populateQueueForUser(user.id)

  const queueItems = await db
    .select({
      queueId: userQueue.id,
      score: userQueue.score,
      status: userQueue.status,
      queuedAt: userQueue.queuedAt,
      articleId: articles.id,
      title: articles.title,
      url: articles.url,
      description: articles.description,
      publishedAt: articles.publishedAt,
      hook: articleClassifications.hook,
      category: articleClassifications.category,
      tags: articleClassifications.tags,
      globalScore: articleClassifications.globalScore,
      sourceName: sources.name,
      sourceSlug: sources.slug,
      sourceIcon: sources.iconUrl,
    })
    .from(userQueue)
    .innerJoin(articles, eq(userQueue.articleId, articles.id))
    .innerJoin(articleClassifications, eq(articles.id, articleClassifications.articleId))
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(and(eq(userQueue.userId, user.id), eq(userQueue.status, 'pending')))
    .orderBy(desc(userQueue.score))
    .limit(50)

  return (
    <QueueView
      items={queueItems}
      userName={user.user_metadata?.full_name?.split(' ')[0] ?? 'there'}
    />
  )
}
