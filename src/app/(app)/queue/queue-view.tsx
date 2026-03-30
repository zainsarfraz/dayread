/**
 * Client-side queue view with interactive card actions.
 *
 * Handles read/skip/bookmark actions with optimistic UI updates
 * and smooth card dismissal animations.
 */

'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { Bookmark, Check, X, Flame } from 'lucide-react'

type QueueItem = {
  queueId: string
  score: number
  status: string
  queuedAt: Date
  articleId: string
  title: string
  url: string
  description: string | null
  publishedAt: Date | null
  hook: string
  category: string
  tags: string[]
  globalScore: number
  sourceName: string
  sourceSlug: string
  sourceIcon: string | null
}

export function QueueView({ items, userName }: { items: QueueItem[]; userName: string }) {
  const [queue, setQueue] = useState(items)
  const [dismissing, setDismissing] = useState<Record<string, 'skip' | 'bookmark'>>({})

  const handleAction = async (queueId: string, articleId: string, action: 'read' | 'skip' | 'bookmark') => {
    if (action === 'read') {
      window.location.href = `/article/${articleId}`
      return
    }

    setDismissing((prev) => ({ ...prev, [queueId]: action }))

    // Wait for animation, then remove from list
    setTimeout(() => {
      setQueue((prev) => prev.filter((item) => item.queueId !== queueId))
      setDismissing((prev) => {
        const next = { ...prev }
        delete next[queueId]
        return next
      })
    }, 250)

    // Fire action to server
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId, articleId, action }),
    })
  }

  const spotlight = queue[0]
  const rest = queue.slice(1)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          {getTimeOfDay()}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-text-primary sm:text-4xl">
          {queue.length > 0
            ? `${queue.length} articles for you`
            : 'All caught up'}
        </h1>
      </div>

      {/* Spotlight card */}
      {spotlight && (
        <div className="mb-10">
          <SpotlightCard
            item={spotlight}
            dismissState={dismissing[spotlight.queueId]}
            onAction={(action) => handleAction(spotlight.queueId, spotlight.articleId, action)}
          />
        </div>
      )}

      {/* Rest of queue */}
      {rest.length > 0 && (
        <div>
          <div className="mb-5 h-px bg-border" />
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.15em] text-text-tertiary">
            Up next
          </p>
          <div className="flex flex-col gap-3">
            {rest.map((item, i) => (
              <CompactCard
                key={item.queueId}
                item={item}
                position={i + 2}
                dismissState={dismissing[item.queueId]}
                onAction={(action) => handleAction(item.queueId, item.articleId, action)}
              />
            ))}
          </div>
        </div>
      )}

      {queue.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <Flame className="mb-4 h-10 w-10 text-text-tertiary" />
          <p className="text-lg text-text-secondary">All caught up!</p>
          <p className="mt-1 text-sm text-text-tertiary">
            New articles will appear as sources are polled.
          </p>
        </div>
      )}
    </div>
  )
}

function SpotlightCard({
  item,
  dismissState,
  onAction,
}: {
  item: QueueItem
  dismissState?: 'skip' | 'bookmark'
  onAction: (action: 'read' | 'skip' | 'bookmark') => void
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-border bg-surface p-6 transition-all sm:p-8',
        dismissState === 'skip' && 'animate-slide-left',
        dismissState === 'bookmark' && 'animate-slide-right',
      )}
    >
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <SourceBadge name={item.sourceName} iconUrl={item.sourceIcon} />
        <span>·</span>
        <span>{formatTimeAgo(item.publishedAt)}</span>
      </div>

      <h2 className="mt-4 font-serif text-2xl font-medium leading-snug text-text-primary sm:text-[1.75rem]">
        {item.title}
      </h2>

      <p className="mt-3 text-[0.95rem] leading-relaxed text-text-secondary">
        {item.hook}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.tags.slice(0, 3).map((tag) => (
          <TagPill key={tag} tag={tag} />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={() => onAction('read')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Read
        </button>
        <button
          onClick={() => onAction('bookmark')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <Bookmark className="h-4 w-4" />
        </button>
        <button
          onClick={() => onAction('skip')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function CompactCard({
  item,
  position,
  dismissState,
  onAction,
}: {
  item: QueueItem
  position: number
  dismissState?: 'skip' | 'bookmark'
  onAction: (action: 'read' | 'skip' | 'bookmark') => void
}) {
  return (
    <div
      className={clsx(
        'group flex items-start gap-4 rounded-xl border border-border bg-surface px-5 py-4 transition-all hover:bg-surface-hover',
        dismissState === 'skip' && 'animate-slide-left',
        dismissState === 'bookmark' && 'animate-slide-right',
      )}
    >
      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center font-mono text-xs text-text-tertiary">
        {position}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="font-medium leading-snug text-text-primary">
          {item.title}
        </h3>

        <div className="mt-1.5 flex items-center gap-2 text-xs text-text-tertiary">
          <span>{item.sourceName}</span>
          <span>·</span>
          <span>{formatTimeAgo(item.publishedAt)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onAction('read')}
          title="Read"
          className="cursor-pointer rounded-md p-1.5 text-text-tertiary transition-colors hover:text-accent"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => onAction('bookmark')}
          title="Bookmark"
          className="cursor-pointer rounded-md p-1.5 text-text-tertiary transition-colors hover:text-accent"
        >
          <Bookmark className="h-4 w-4" />
        </button>
        <button
          onClick={() => onAction('skip')}
          title="Skip"
          className="cursor-pointer rounded-md p-1.5 text-text-tertiary transition-colors hover:text-text-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SourceBadge({ name, iconUrl }: { name: string; iconUrl: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-hover px-2.5 py-0.5 text-xs font-medium text-text-secondary">
      {iconUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="" className="h-3.5 w-3.5 rounded-full" />
      )}
      {name}
    </span>
  )
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span className="rounded-sm bg-surface-hover px-2 py-0.5 font-mono text-xs text-text-tertiary">
      {tag}
    </span>
  )
}

function formatTimeAgo(date: Date | null) {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}
