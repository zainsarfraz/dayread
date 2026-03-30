/**
 * Stats page — reading analytics dashboard.
 *
 * Shows streaks, summary cards, top topics, top sources,
 * and reading time distribution. All computed server-side from user_actions.
 */

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { userActions, articleClassifications, articles, sources } from '@/db/schema'
import { eq, and, gte, sql, desc, inArray } from 'drizzle-orm'
import { StatsView } from './stats-view'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twelveWeeksAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000)

  // All queries in parallel
  const [weeklyActions, monthlyActions, readDates, topTopics, topSources, timeDistribution, feedbackStats] =
    await Promise.all([
      // Weekly summary
      db
        .select({
          action: userActions.action,
          count: sql<number>`count(*)::int`,
          totalTimeMs: sql<number>`coalesce(sum(${userActions.timeSpentMs}), 0)::int`,
        })
        .from(userActions)
        .where(
          and(
            eq(userActions.userId, user.id),
            gte(userActions.createdAt, startOfWeek),
          ),
        )
        .groupBy(userActions.action),

      // Monthly summary
      db
        .select({
          action: userActions.action,
          count: sql<number>`count(*)::int`,
          totalTimeMs: sql<number>`coalesce(sum(${userActions.timeSpentMs}), 0)::int`,
        })
        .from(userActions)
        .where(
          and(
            eq(userActions.userId, user.id),
            gte(userActions.createdAt, startOfMonth),
          ),
        )
        .groupBy(userActions.action),

      // Read dates for streak + contribution grid (last 12 weeks)
      db
        .select({
          date: sql<string>`date(${userActions.createdAt})`,
          count: sql<number>`count(*)::int`,
        })
        .from(userActions)
        .where(
          and(
            eq(userActions.userId, user.id),
            eq(userActions.action, 'read'),
            gte(userActions.createdAt, twelveWeeksAgo),
          ),
        )
        .groupBy(sql`date(${userActions.createdAt})`)
        .orderBy(desc(sql`date(${userActions.createdAt})`)),

      // Top topics (last 30 days)
      db
        .select({
          tag: sql<string>`unnest(${articleClassifications.tags})`,
          count: sql<number>`count(*)::int`,
        })
        .from(userActions)
        .innerJoin(
          articleClassifications,
          eq(userActions.articleId, articleClassifications.articleId),
        )
        .where(
          and(
            eq(userActions.userId, user.id),
            eq(userActions.action, 'read'),
            gte(userActions.createdAt, thirtyDaysAgo),
          ),
        )
        .groupBy(sql`unnest(${articleClassifications.tags})`)
        .orderBy(desc(sql`count(*)`))
        .limit(8),

      // Top sources (last 30 days)
      db
        .select({
          sourceName: sources.name,
          count: sql<number>`count(*)::int`,
        })
        .from(userActions)
        .innerJoin(articles, eq(userActions.articleId, articles.id))
        .innerJoin(sources, eq(articles.sourceId, sources.id))
        .where(
          and(
            eq(userActions.userId, user.id),
            eq(userActions.action, 'read'),
            gte(userActions.createdAt, thirtyDaysAgo),
          ),
        )
        .groupBy(sources.name)
        .orderBy(desc(sql`count(*)`))
        .limit(5),

      // Reading time distribution (last 30 days)
      db
        .select({
          hour: sql<number>`extract(hour from ${userActions.createdAt})::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(userActions)
        .where(
          and(
            eq(userActions.userId, user.id),
            eq(userActions.action, 'read'),
            gte(userActions.createdAt, thirtyDaysAgo),
          ),
        )
        .groupBy(sql`extract(hour from ${userActions.createdAt})`)
        .orderBy(sql`extract(hour from ${userActions.createdAt})`),

      // Feedback stats (all time)
      db
        .select({
          action: userActions.action,
          count: sql<number>`count(*)::int`,
        })
        .from(userActions)
        .where(
          and(
            eq(userActions.userId, user.id),
            inArray(userActions.action, ['feedback_positive', 'feedback_negative']),
          ),
        )
        .groupBy(userActions.action),
    ])

  // Compute streak
  const today = new Date().toISOString().split('T')[0]
  const readDateSet = new Set(readDates.map((d) => d.date))

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  const checkDate = new Date(now)

  // Check if today has reads — if not, start from yesterday
  if (!readDateSet.has(today)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  for (let i = 0; i < 84; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (readDateSet.has(dateStr)) {
      tempStreak++
      if (i < 84) currentStreak = tempStreak // keep updating while consecutive
    } else {
      if (currentStreak === 0) currentStreak = tempStreak
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 0
    }
    checkDate.setDate(checkDate.getDate() - 1)
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

  // Build contribution grid data (last 12 weeks)
  const gridData: { date: string; count: number }[] = []
  const gridDate = new Date(twelveWeeksAgo)
  while (gridDate <= now) {
    const dateStr = gridDate.toISOString().split('T')[0]
    const match = readDates.find((d) => d.date === dateStr)
    gridData.push({ date: dateStr, count: match?.count ?? 0 })
    gridDate.setDate(gridDate.getDate() + 1)
  }

  // Parse action summaries
  const parseSummary = (actions: typeof weeklyActions) => ({
    read: actions.find((a) => a.action === 'read')?.count ?? 0,
    skipped: actions.find((a) => a.action === 'skip')?.count ?? 0,
    bookmarked: actions.find((a) => a.action === 'bookmark')?.count ?? 0,
    timeMs: actions.find((a) => a.action === 'read')?.totalTimeMs ?? 0,
  })

  // Parse time distribution into periods
  const timePeriods = [
    { label: 'Morning', range: '6am–12pm', count: 0 },
    { label: 'Afternoon', range: '12pm–6pm', count: 0 },
    { label: 'Evening', range: '6pm–12am', count: 0 },
    { label: 'Night', range: '12am–6am', count: 0 },
  ]
  for (const { hour, count } of timeDistribution) {
    if (hour >= 6 && hour < 12) timePeriods[0].count += count
    else if (hour >= 12 && hour < 18) timePeriods[1].count += count
    else if (hour >= 18) timePeriods[2].count += count
    else timePeriods[3].count += count
  }

  const feedback = {
    positive: feedbackStats.find((f) => f.action === 'feedback_positive')?.count ?? 0,
    negative: feedbackStats.find((f) => f.action === 'feedback_negative')?.count ?? 0,
  }

  return (
    <StatsView
      streak={{ current: currentStreak, longest: longestStreak }}
      grid={gridData}
      weekly={parseSummary(weeklyActions)}
      monthly={parseSummary(monthlyActions)}
      topTopics={topTopics}
      topSources={topSources}
      timePeriods={timePeriods}
      feedback={feedback}
    />
  )
}
