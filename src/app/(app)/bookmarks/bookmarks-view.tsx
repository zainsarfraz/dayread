/**
 * Client-side bookmarks view.
 *
 * Shows bookmarked articles with option to remove bookmark or read.
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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-text-primary">Bookmarks</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {bookmarks.length > 0
          ? `${bookmarks.length} saved article${bookmarks.length === 1 ? '' : 's'}`
          : 'No bookmarks yet'}
      </p>

      {bookmarks.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {bookmarks.map((item) => (
            <div
              key={item.queueId}
              className={clsx(
                'group rounded-lg border border-border bg-surface p-4 transition-all',
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
                <span>{formatTimeAgo(item.actedAt)}</span>
              </div>

              <Link
                href={`/article/${item.articleId}`}
                className="mt-2 block font-medium leading-snug text-text-primary hover:text-accent transition-colors"
              >
                {item.title}
              </Link>

              <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                {item.hook}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/article/${item.articleId}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                >
                  Read
                </Link>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  Original
                </a>
                <button
                  onClick={() => handleRemove(item.queueId, item.articleId)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
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
        <div className="flex flex-col items-center py-20 text-center">
          <Bookmark className="mb-4 h-10 w-10 text-text-tertiary" />
          <p className="text-lg text-text-secondary">No bookmarks yet</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Bookmark articles from your queue to save them here.
          </p>
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
