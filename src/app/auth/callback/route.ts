/**
 * OAuth callback handler.
 *
 * Exchanges the auth code from Google for a Supabase session,
 * then redirects to the queue (or onboarding for new users).
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { userProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [profile] = await db
          .select({ onboarded: userProfiles.onboarded })
          .from(userProfiles)
          .where(eq(userProfiles.id, user.id))
          .limit(1)

        // New user or not onboarded → onboarding
        if (!profile || !profile.onboarded) {
          // Create profile if it doesn't exist
          if (!profile) {
            await db.insert(userProfiles).values({
              id: user.id,
              displayName: user.user_metadata?.full_name ?? user.email,
              avatarUrl: user.user_metadata?.avatar_url,
            }).onConflictDoNothing()
          }
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}/queue`)
    }
  }

  // Auth error — redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
