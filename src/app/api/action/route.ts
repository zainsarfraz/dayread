/**
 * User action endpoint.
 *
 * Records user actions (read, skip, bookmark, feedback) and updates
 * queue status and preference weights accordingly.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { userQueue, userActions, userPreferences, articleClassifications } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { queueId, articleId, action, timeSpentMs } = body

  // For feedback actions, delete any previous feedback first so only the latest persists
  if (action === 'feedback_positive' || action === 'feedback_negative' || action === 'feedback_clear') {
    await db
      .delete(userActions)
      .where(
        and(
          eq(userActions.userId, user.id),
          eq(userActions.articleId, articleId),
          inArray(userActions.action, ['feedback_positive', 'feedback_negative']),
        ),
      )
  }

  // Record the action (skip for feedback_clear — we just deleted the old one)
  if (action !== 'feedback_clear') {
    await db.insert(userActions).values({
      userId: user.id,
      articleId,
      action,
      timeSpentMs: timeSpentMs ?? null,
    })
  }

  // Update queue status
  if (queueId && (action === 'read' || action === 'skip' || action === 'bookmark')) {
    await db
      .update(userQueue)
      .set({ status: action === 'bookmark' ? 'bookmarked' : action, actedAt: new Date() })
      .where(and(eq(userQueue.id, queueId), eq(userQueue.userId, user.id)))
  }

  // Unbookmark: set status back to pending
  if (queueId && action === 'unbookmark') {
    await db
      .update(userQueue)
      .set({ status: 'pending', actedAt: null })
      .where(and(eq(userQueue.id, queueId), eq(userQueue.userId, user.id)))
  }

  // Update preference weights based on action
  if (action === 'read' || action === 'skip' || action === 'bookmark') {
    const [classification] = await db
      .select({ tags: articleClassifications.tags })
      .from(articleClassifications)
      .where(eq(articleClassifications.articleId, articleId))
      .limit(1)

    if (classification?.tags) {
      const delta = action === 'bookmark' ? 5 : action === 'read' ? 2 : -1
      const timeBonus = action === 'read' && timeSpentMs && timeSpentMs > 120_000 ? 1 : 0

      for (const tag of classification.tags) {
        // Upsert preference weight
        await db
          .insert(userPreferences)
          .values({ userId: user.id, tag, weight: Math.max(0, Math.min(100, 50 + delta + timeBonus)) })
          .onConflictDoUpdate({
            target: [userPreferences.userId, userPreferences.tag],
            set: {
              weight: /* SQL: LEAST(100, GREATEST(0, weight + delta + timeBonus)) */
                // Simplified: we read current and compute in app
                undefined as never,
            },
          })
          .catch(() => {
            // Fallback: read-modify-write
          })

        // Read-modify-write for correct weight update
        const [existing] = await db
          .select({ weight: userPreferences.weight })
          .from(userPreferences)
          .where(
            and(
              eq(userPreferences.userId, user.id),
              eq(userPreferences.tag, tag),
            ),
          )
          .limit(1)

        const currentWeight = existing?.weight ?? 50
        const newWeight = Math.max(0, Math.min(100, currentWeight + delta + timeBonus))

        await db
          .insert(userPreferences)
          .values({ userId: user.id, tag, weight: newWeight, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: [userPreferences.userId, userPreferences.tag],
            set: { weight: newWeight, updatedAt: new Date() },
          })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
