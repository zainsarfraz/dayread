/**
 * Client-side article view with on-demand summary generation.
 *
 * If no cached summary exists, fetches one from the AI endpoint.
 * Tracks time spent for preference learning.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Check, ExternalLink, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import Link from 'next/link'

type ArticleData = {
  id: string
  title: string
  url: string
  description: string | null
  publishedAt: Date | null
  sourceName: string
  sourceIcon: string | null
  hook: string
  category: string
  tags: string[]
  summary: string | null
  keyPoints: string[] | null
}

export function ArticleView({
  article,
  userId,
  queueId,
  queueStatus,
  existingFeedback,
}: {
  article: ArticleData
  userId: string
  queueId?: string
  queueStatus?: string
  existingFeedback?: 'up' | 'down' | null
}) {
  const [summary, setSummary] = useState(article.summary)
  const [keyPoints, setKeyPoints] = useState(article.keyPoints)
  const [loading, setLoading] = useState(!article.summary)
  const [markedRead, setMarkedRead] = useState(queueStatus === 'read')
  const startTime = useRef(Date.now())

  // Generate summary on demand if not cached
  useEffect(() => {
    if (article.summary) return

    const generateSummary = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: article.id }),
        })
        if (res.ok) {
          const data = await res.json()
          setSummary(data.summary)
          setKeyPoints(data.keyPoints)
        }
      } finally {
        setLoading(false)
      }
    }

    generateSummary()
  }, [article.id, article.summary])

  // Log view action on mount
  useEffect(() => {
    fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId: article.id, action: 'view' }),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-[680px] px-4 py-8 sm:px-6">
      {/* Back link */}
      <Link
        href="/queue"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Queue
      </Link>

      {/* Source badge */}
      <div className="mb-4 flex items-center gap-2">
        {article.sourceIcon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.sourceIcon} alt="" className="h-5 w-5 rounded-full" />
        )}
        <span className="text-sm font-medium text-text-secondary">{article.sourceName}</span>
      </div>

      {/* Title */}
      <h1 className="font-serif text-3xl font-semibold leading-tight text-text-primary">
        {article.title}
      </h1>

      {/* Metadata */}
      <div className="mt-3 flex items-center gap-2 text-sm text-text-tertiary">
        {article.publishedAt && (
          <time>{formatDate(article.publishedAt)}</time>
        )}
        <span>·</span>
        <span className="capitalize">{article.category}</span>
      </div>

      {/* Divider */}
      <hr className="my-6 border-border" />

      {/* Summary */}
      {loading ? (
        <div className="flex items-center gap-3 py-12 text-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Generating summary...</span>
        </div>
      ) : (
        <div className="prose-article">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent">
            AI Summary
          </p>

          {summary && (
            <div className="space-y-4 text-text-primary">
              {summary.split('\n\n').map((paragraph, i) => (
                <p key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {keyPoints && keyPoints.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Key Takeaways
              </h2>
              <ul className="space-y-2">
                {keyPoints.map((point, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-text-primary animate-fade-in"
                    style={{ animationDelay: `${(i + 3) * 100}ms` }}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <hr className="my-8 border-border" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
        >
          <ExternalLink className="h-4 w-4" />
          Read full article
        </a>

        {queueId && !markedRead && (
          <button
            onClick={() => {
              setMarkedRead(true)
              const timeSpent = Date.now() - startTime.current
              fetch('/api/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  queueId,
                  articleId: article.id,
                  action: 'read',
                  timeSpentMs: timeSpent,
                }),
              })
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Check className="h-4 w-4" />
            Mark as Read
          </button>
        )}

        {markedRead && (
          <span className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-success">
            <Check className="h-4 w-4" />
            Marked as read
          </span>
        )}
      </div>

      {/* Feedback */}
      <FeedbackSection articleId={article.id} initial={existingFeedback ?? null} />
    </div>
  )
}

function FeedbackSection({ articleId, initial }: { articleId: string; initial: 'up' | 'down' | null }) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(initial)

  const handleClick = (value: 'up' | 'down') => {
    const newValue = feedback === value ? null : value
    setFeedback(newValue)

    fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId,
        action: newValue === null
          ? 'feedback_clear'
          : newValue === 'up'
            ? 'feedback_positive'
            : 'feedback_negative',
      }),
    })
  }

  return (
    <div className="mt-8 border-t border-border pt-6">
      <p className="mb-3 text-sm text-text-secondary">Was this useful?</p>
      <div className="flex gap-2">
        <button
          onClick={() => handleClick('up')}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
            feedback === 'up'
              ? 'border-accent/30 bg-accent-muted text-accent'
              : 'border-border text-text-tertiary hover:bg-surface-hover hover:text-text-secondary'
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
          Yes
        </button>
        <button
          onClick={() => handleClick('down')}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
            feedback === 'down'
              ? 'border-accent/30 bg-accent-muted text-accent'
              : 'border-border text-text-tertiary hover:bg-surface-hover hover:text-text-secondary'
          }`}
        >
          <ThumbsDown className="h-4 w-4" />
          No
        </button>
      </div>
    </div>
  )
}

function formatDate(date: Date) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffHours < 48) return 'Yesterday'

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
