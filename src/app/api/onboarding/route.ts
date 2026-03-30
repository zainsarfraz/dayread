/**
 * Onboarding API — saves user's interest selections as preference weights,
 * marks user as onboarded, and populates their initial queue.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { userProfiles, userPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { populateQueueForUser } from '@/lib/scoring/populate-queue'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tagWeights } = await request.json() as { tagWeights: Record<string, number> }

  // Upsert user profile (create if first login, mark as onboarded)
  await db
    .insert(userProfiles)
    .values({
      id: user.id,
      displayName: user.user_metadata?.full_name ?? user.email,
      avatarUrl: user.user_metadata?.avatar_url,
      onboarded: true,
    })
    .onConflictDoUpdate({
      target: userProfiles.id,
      set: { onboarded: true, updatedAt: new Date() },
    })

  // Save preference weights
  for (const [tag, weight] of Object.entries(tagWeights)) {
    await db
      .insert(userPreferences)
      .values({ userId: user.id, tag, weight })
      .onConflictDoUpdate({
        target: [userPreferences.userId, userPreferences.tag],
        set: { weight, updatedAt: new Date() },
      })
  }

  // Populate their queue with existing classified articles
  const queueResult = await populateQueueForUser(user.id)

  return NextResponse.json({ ok: true, queuedArticles: queueResult })
}
