/**
 * Minimal top navigation bar.
 *
 * Logo + nav links + user avatar. Stays out of the way — content is king.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Bookmark, Settings, LogOut } from 'lucide-react'
import { useState } from 'react'

type NavUser = {
  name: string
  avatarUrl?: string
}

const navLinks = [
  { href: '/queue', label: 'Queue' },
  { href: '/bookmarks', label: 'Bookmarks' },
  { href: '/history', label: 'History' },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function NavBar({ user }: { user: NavUser }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="border-b border-border bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/queue" className="text-lg font-semibold text-text-primary">
          dayread
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-surface text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary',
              )}
            >
              {label}
            </Link>
          ))}

          {/* User menu */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border transition-colors hover:border-text-tertiary"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-medium text-text-secondary">
                  {user.name[0]?.toUpperCase()}
                </span>
              )}
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-sm font-medium text-text-primary">{user.name}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
