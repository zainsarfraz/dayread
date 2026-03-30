/**
 * Supabase client for browser-side usage (client components).
 *
 * Creates a singleton browser client that manages auth state
 * and token refresh automatically.
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
