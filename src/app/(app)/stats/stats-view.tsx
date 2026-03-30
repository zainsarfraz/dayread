/**
 * Stats view — renders all analytics sections.
 *
 * Pure presentational component. All data is computed server-side.
 */

'use client'

import { clsx } from 'clsx'
import { Flame, BookOpen, Bookmark, SkipForward, Clock } from 'lucide-react'

type StatsProps = {
  streak: { current: number; longest: number }
  grid: { date: string; count: number }[]
  weekly: { read: number; skipped: number; bookmarked: number; timeMs: number }
  monthly: { read: number; skipped: number; bookmarked: number; timeMs: number }
  topTopics: { tag: string; count: number }[]
  topSources: { sourceName: string; count: number }[]
  timePeriods: { label: string; range: string; count: number }[]
}

export function StatsView({
  streak,
  grid,
  weekly,
  monthly,
  topTopics,
  topSources,
  timePeriods,
}: StatsProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-text-primary">Stats</h1>
      <p className="mt-1 text-sm text-text-secondary">Your reading habits at a glance</p>

      {/* Streak */}
      <div className="mt-8 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted">
            <Flame className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-text-primary">
              {streak.current} day{streak.current !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-text-secondary">
              Current streak · Longest: {streak.longest} day{streak.longest !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Contribution grid */}
        <div className="mt-5 overflow-x-auto">
          <div className="flex gap-[3px]">
            {chunkByWeek(grid).map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} article${day.count !== 1 ? 's' : ''} read`}
                    className={clsx(
                      'h-3 w-3 rounded-sm',
                      day.count === 0 && 'bg-surface-hover',
                      day.count >= 1 && day.count <= 2 && 'bg-accent/30',
                      day.count >= 3 && day.count <= 5 && 'bg-accent/60',
                      day.count >= 6 && 'bg-accent',
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-text-tertiary">
            <span>Less</span>
            <div className="h-3 w-3 rounded-sm bg-surface-hover" />
            <div className="h-3 w-3 rounded-sm bg-accent/30" />
            <div className="h-3 w-3 rounded-sm bg-accent/60" />
            <div className="h-3 w-3 rounded-sm bg-accent" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <SummaryCard title="This Week" data={weekly} />
        <SummaryCard title="This Month" data={monthly} />
      </div>

      {/* Top Topics */}
      {topTopics.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Top Topics
          </h2>
          <p className="mt-0.5 text-xs text-text-tertiary">Last 30 days</p>
          <div className="mt-4 flex flex-col gap-3">
            {topTopics.map((topic, i) => {
              const maxCount = topTopics[0].count
              const pct = maxCount > 0 ? (topic.count / maxCount) * 100 : 0
              return (
                <div key={topic.tag}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono text-text-primary">{formatTag(topic.tag)}</span>
                    <span className="text-text-tertiary">{topic.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Sources */}
      {topSources.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Top Sources
          </h2>
          <p className="mt-0.5 text-xs text-text-tertiary">Last 30 days</p>
          <div className="mt-4 flex flex-col gap-3">
            {topSources.map((source) => {
              const maxCount = topSources[0].count
              const pct = maxCount > 0 ? (source.count / maxCount) * 100 : 0
              return (
                <div key={source.sourceName}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{source.sourceName}</span>
                    <span className="text-text-tertiary">{source.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reading Time Distribution */}
      {timePeriods.some((p) => p.count > 0) && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            When You Read
          </h2>
          <p className="mt-0.5 text-xs text-text-tertiary">Last 30 days</p>
          <div className="mt-4 flex flex-col gap-3">
            {timePeriods.map((period) => {
              const total = timePeriods.reduce((sum, p) => sum + p.count, 0)
              const pct = total > 0 ? (period.count / total) * 100 : 0
              return (
                <div key={period.label}>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-text-primary">{period.label}</span>
                      <span className="ml-2 text-text-tertiary">{period.range}</span>
                    </div>
                    <span className="text-text-tertiary">{Math.round(pct)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {weekly.read === 0 && monthly.read === 0 && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-8 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-text-tertiary" />
          <p className="text-text-secondary">No reading data yet</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Start reading articles from your queue to see stats here.
          </p>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  data,
}: {
  title: string
  data: { read: number; skipped: number; bookmarked: number; timeMs: number }
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {title}
      </h3>
      <div className="mt-3 flex flex-col gap-2">
        <StatRow icon={BookOpen} label="Read" value={data.read} accent />
        <StatRow icon={Bookmark} label="Bookmarked" value={data.bookmarked} />
        <StatRow icon={SkipForward} label="Skipped" value={data.skipped} />
        <StatRow icon={Clock} label="Time" value={formatTime(data.timeMs)} />
      </div>
    </div>
  )
}

function StatRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof BookOpen
  label: string
  value: number | string
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <span className={clsx('text-sm font-medium', accent ? 'text-accent' : 'text-text-primary')}>
        {value}
      </span>
    </div>
  )
}

function chunkByWeek(days: { date: string; count: number }[]) {
  const weeks: { date: string; count: number }[][] = []
  let currentWeek: { date: string; count: number }[] = []

  for (const day of days) {
    const dayOfWeek = new Date(day.date).getDay()
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  return weeks
}

function formatTag(tag: string) {
  return tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTime(ms: number) {
  if (ms === 0) return '0m'
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
}
