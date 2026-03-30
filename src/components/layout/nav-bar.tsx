/**
 * Top navigation bar.
 *
 * Desktop: logo + primary links + secondary links in avatar dropdown
 * Mobile: logo + hamburger with all links
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { LogOut, BookOpen, Bookmark, History, BarChart3, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'

type NavUser = {
  name: string
  avatarUrl?: string
}

const primaryLinks = [
  { href: '/queue', label: 'Queue', icon: BookOpen },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/history', label: 'History', icon: History },
]

const secondaryLinks = [
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function NavBar({ user }: { user: NavUser }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const [showMobile, setShowMobile] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/queue" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="" className="h-7 w-7 rounded-md" />
          <span className="text-base font-semibold text-text-primary">dayread</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 sm:flex">
          {primaryLinks.map(({ href, label }) => (
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

          {/* Avatar with dropdown for secondary links */}
          <div className="relative ml-3">
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
                  {secondaryLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setShowMenu(false)}
                      className={clsx(
                        'flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-hover',
                        pathname.startsWith(href)
                          ? 'text-text-primary'
                          : 'text-text-secondary hover:text-text-primary',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                  <div className="border-t border-border">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setShowMobile(!showMobile)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface sm:hidden"
        >
          {showMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {showMobile && (
        <div className="border-t border-border bg-bg px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {[...primaryLinks, ...secondaryLinks].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setShowMobile(false)}
                className={clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-surface text-text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <div className="my-1 border-t border-border" />
            <div className="flex items-center gap-3 px-3 py-2">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="h-6 w-6 rounded-full" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-hover text-xs font-medium text-text-secondary">
                  {user.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-text-secondary">{user.name}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
