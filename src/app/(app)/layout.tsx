/**
 * Layout for authenticated app pages.
 *
 * Provides the top navigation bar with links to queue, bookmarks, stats, settings.
 */

import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/layout/nav-bar'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-dvh bg-bg">
      <NavBar
        user={{
          name: user.user_metadata?.full_name ?? user.email ?? '',
          avatarUrl: user.user_metadata?.avatar_url,
        }}
      />
      <main>{children}</main>
    </div>
  )
}
