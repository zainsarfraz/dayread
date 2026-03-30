/**
 * Settings page — user preferences, source management, and account.
 *
 * Shows preference weight sliders, source toggles, and account actions.
 */

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { userPreferences, sources, userProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SettingsView } from './settings-view'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [preferences, allSources, profile] = await Promise.all([
    db
      .select({ tag: userPreferences.tag, weight: userPreferences.weight })
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id)),
    db
      .select({
        id: sources.id,
        name: sources.name,
        slug: sources.slug,
        url: sources.url,
        iconUrl: sources.iconUrl,
        active: sources.active,
      })
      .from(sources),
    db
      .select({ onboarded: userProfiles.onboarded })
      .from(userProfiles)
      .where(eq(userProfiles.id, user.id))
      .limit(1),
  ])

  return (
    <SettingsView
      user={{
        name: user.user_metadata?.full_name ?? user.email ?? '',
        email: user.email ?? '',
        avatarUrl: user.user_metadata?.avatar_url,
      }}
      preferences={preferences}
      sources={allSources}
    />
  )
}
