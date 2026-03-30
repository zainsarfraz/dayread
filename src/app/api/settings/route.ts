/**
 * Settings API — saves user preference weights and source toggles.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { userPreferences, sources } from '@/db/schema'
import { eq } from 'drizzle-orm'

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

  // Update source active states
  for (const [sourceId, active] of Object.entries(body.sources)) {
    await db
      .update(sources)
      .set({ active, updatedAt: new Date() })
      .where(eq(sources.id, sourceId))
  }

  return NextResponse.json({ ok: true })
}
