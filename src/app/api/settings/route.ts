/**
 * Settings API — saves user preference weights and per-user source toggles.
 *
 * Source toggles are per-user (not global). Disabling a source hides
 * its articles from the user's queue without affecting other users.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { userPreferences, userSourcePreferences, userQueue, articles } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { recalculateQueueForUser } from '@/lib/scoring/populate-queue'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    preferences: Record<string, number>
    sources: Record<string, boolean>
  }

  // Update preference weights
  for (const [tag, weight] of Object.entries(body.preferences)) {
    await db
      .insert(userPreferences)
      .values({ userId: user.id, tag, weight, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [userPreferences.userId, userPreferences.tag],
        set: { weight, updatedAt: new Date() },
      })
  }

  // Update per-user source preferences
  const disabledSourceIds: string[] = []
  for (const [sourceId, enabled] of Object.entries(body.sources)) {
    await db
      .insert(userSourcePreferences)
      .values({ userId: user.id, sourceId, enabled })
      .onConflictDoUpdate({
        target: [userSourcePreferences.userId, userSourcePreferences.sourceId],
        set: { enabled },
      })
    if (!enabled) disabledSourceIds.push(sourceId)
  }

  // Remove pending queue items from disabled sources
  if (disabledSourceIds.length > 0) {
    // Find article IDs from disabled sources that are in the user's pending queue
    const articlesToRemove = await db
      .select({ id: articles.id })
      .from(articles)
      .where(inArray(articles.sourceId, disabledSourceIds))

    if (articlesToRemove.length > 0) {
      const articleIds = articlesToRemove.map((a) => a.id)
      await db
        .delete(userQueue)
        .where(
          and(
            eq(userQueue.userId, user.id),
            eq(userQueue.status, 'pending'),
            inArray(userQueue.articleId, articleIds),
          ),
        )
    }
  }

  // Recalculate queue scores with new weights
  const recalculated = await recalculateQueueForUser(user.id)

  return NextResponse.json({ ok: true, recalculated })
}
