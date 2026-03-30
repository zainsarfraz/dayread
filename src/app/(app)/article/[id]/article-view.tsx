/**
 * Client-side article view with on-demand summary generation.
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

  useEffect(() => {
    fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId: article.id, action: 'view' }),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-[680px] px-4 py-10 sm:px-6">
      {/* Back */}
      <Link
        href="/queue"
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Queue
      </Link>

      {/* Source + meta */}
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        {article.sourceIcon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.sourceIcon} alt="" className="h-4 w-4 rounded-full" />
        )}
        <span>{article.sourceName}</span>
        {article.publishedAt && (
          <>
            <span>·</span>
            <time>{formatDate(article.publishedAt)}</time>
          </>
        )}
        <span>·</span>
        <span className="capitalize">{article.category}</span>
      </div>

      {/* Title */}
      <h1 className="mt-4 font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.15] tracking-tight text-text-primary">
        {article.title}
      </h1>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {article.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-surface-hover px-2 py-0.5 font-mono text-xs text-text-tertiary"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Divider */}
      <div className="my-8 h-px bg-border" />

      {/* Summary */}
      {loading ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="relative mb-5">
            <div className="h-10 w-10 rounded-full border-2 border-surface-hover" />
            <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-accent" />
          </div>
          <p className="text-sm font-medium text-text-secondary">Reading the article</p>
          <p className="mt-1 text-xs text-text-tertiary">Preparing your summary...</p>
        </div>
      ) : (
        <div className="prose-article">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-text-tertiary">
            Summary
          </p>

          {summary && (
            <div className="space-y-5 text-text-primary">
              {summary.split('\n\n').map((paragraph, i) => (
                <p key={i} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {keyPoints && keyPoints.length > 0 && (
            <div className="mt-10">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-text-tertiary">
                Key Takeaways
              </p>
              <ul className="space-y-3">
                {keyPoints.map((point, i) => (
                  <li
                    key={i}
                    className="flex gap-3 animate-fade-in"
                    style={{ animationDelay: `${(i + 3) * 100}ms` }}
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="text-text-primary">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="my-8 h-px bg-border" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
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
    <div className="mt-10 border-t border-border pt-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-text-tertiary">
        Was this useful?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handleClick('up')}
          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            feedback === 'up'
              ? 'border-accent/30 bg-accent-muted text-accent'
              : 'border-border text-text-tertiary hover:bg-surface-hover hover:text-text-secondary'
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          Yes
        </button>
        <button
          onClick={() => handleClick('down')}
          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            feedback === 'down'
              ? 'border-accent/30 bg-accent-muted text-accent'
              : 'border-border text-text-tertiary hover:bg-surface-hover hover:text-text-secondary'
          }`}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
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
