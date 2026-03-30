/**
 * Settings page — user preferences, source management, and account.
 *
 * Source toggles are per-user — disabling a source hides its articles
 * from your queue without affecting other users or global polling.
 */

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { userPreferences, sources, userSourcePreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SettingsView } from './settings-view'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [preferences, allSources, userSourcePrefs] = await Promise.all([
    db
      .select({ tag: userPreferences.tag, weight: userPreferences.weight })
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id)),
    db
      .select({
        id: sources.id,
        name: sources.name,
        slug: sources.slug,
        iconUrl: sources.iconUrl,
      })
      .from(sources),
    db
      .select({
        sourceId: userSourcePreferences.sourceId,
        enabled: userSourcePreferences.enabled,
      })
      .from(userSourcePreferences)
      .where(eq(userSourcePreferences.userId, user.id)),
  ])

  // Build source list with per-user enabled state (default: enabled)
  const userSourceMap = Object.fromEntries(userSourcePrefs.map((p) => [p.sourceId, p.enabled]))
  const sourcesWithState = allSources.map((s) => ({
    ...s,
    enabled: userSourceMap[s.id] ?? true,
  }))

  return (
    <SettingsView
      user={{
        name: user.user_metadata?.full_name ?? user.email ?? '',
        email: user.email ?? '',
        avatarUrl: user.user_metadata?.avatar_url,
      }}
      preferences={preferences}
      sources={sourcesWithState}
    />
  )
}
