/**
 * Client-side history view — list of read articles.
 */

'use client'

import { BookOpen } from 'lucide-react'
import Link from 'next/link'

type HistoryItem = {
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

export function HistoryView({ items }: { items: HistoryItem[] }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-text-primary">History</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {items.length > 0
          ? `${items.length} article${items.length === 1 ? '' : 's'} read`
          : 'No articles read yet'}
      </p>

      {items.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {items.map((item) => (
            <Link
              key={item.queueId}
              href={`/article/${item.articleId}`}
              className="group rounded-lg border border-border bg-surface p-4 transition-all hover:bg-surface-hover"
            >
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                {item.sourceIcon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.sourceIcon} alt="" className="h-3.5 w-3.5 rounded-full" />
                )}
                <span>{item.sourceName}</span>
                <span>·</span>
                <span>Read {formatTimeAgo(item.actedAt)}</span>
              </div>

              <h3 className="mt-2 font-medium leading-snug text-text-primary group-hover:text-accent transition-colors">
                {item.title}
              </h3>

              <p className="mt-1 text-sm text-text-secondary line-clamp-1">
                {item.hook}
              </p>
            </Link>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <BookOpen className="mb-4 h-10 w-10 text-text-tertiary" />
          <p className="text-lg text-text-secondary">No reading history yet</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Articles you mark as read will appear here.
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
