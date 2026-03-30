/**
 * Client-side bookmarks view.
 */

'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { BookmarkX, ExternalLink, Bookmark } from 'lucide-react'
import Link from 'next/link'

type BookmarkItem = {
  queueId: string
  actedAt: Date | null
  articleId: string
  title: string
  url: string
  publishedAt: Date | null
  hook: string
  category: string
  tags: string[]
  sourceName: string
  sourceIcon: string | null
}

export function BookmarksView({ items }: { items: BookmarkItem[] }) {
  const [bookmarks, setBookmarks] = useState(items)
  const [removing, setRemoving] = useState<Set<string>>(new Set())

  const handleRemove = async (queueId: string, articleId: string) => {
    setRemoving((prev) => new Set(prev).add(queueId))

    setTimeout(() => {
      setBookmarks((prev) => prev.filter((b) => b.queueId !== queueId))
      setRemoving((prev) => {
        const next = new Set(prev)
        next.delete(queueId)
        return next
      })
    }, 250)

    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId, articleId, action: 'unbookmark' }),
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Saved</p>
      <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-text-primary sm:text-4xl">
        {bookmarks.length > 0
          ? `${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'}`
          : 'No bookmarks'}
      </h1>

      {bookmarks.length > 0 && (
        <div className="mt-8 flex flex-col gap-3">
          {bookmarks.map((item) => (
            <div
              key={item.queueId}
              className={clsx(
                'group rounded-xl border border-border bg-surface px-5 py-4 transition-all',
                removing.has(item.queueId) && 'animate-slide-left',
              )}
            >
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                {item.sourceIcon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.sourceIcon} alt="" className="h-3.5 w-3.5 rounded-full" />
                )}
                <span>{item.sourceName}</span>
                <span>·</span>
                <span>Saved {formatTimeAgo(item.actedAt)}</span>
              </div>

              <Link
                href={`/article/${item.articleId}`}
                className="mt-2 block font-medium leading-snug text-text-primary transition-colors hover:text-accent"
              >
                {item.title}
              </Link>

              <p className="mt-1 text-sm text-text-secondary line-clamp-1">
                {item.hook}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/article/${item.articleId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                >
                  Read
                </Link>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  Original
                </a>
                <button
                  onClick={() => handleRemove(item.queueId, item.articleId)}
                  className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  <BookmarkX className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {bookmarks.length === 0 && (
        <div className="mt-16 text-center">
          <Bookmark className="mx-auto mb-4 h-10 w-10 text-text-tertiary" />
          <p className="text-text-secondary">Bookmark articles from your queue to save them here.</p>
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(date: Date | null) {
  if (!date) return 'just now'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
