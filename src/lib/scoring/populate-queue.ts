/**
 * Queue population — computes personalized scores and inserts articles
 * into each user's queue after classification.
 *
 * Called after classification completes. For each active user, scores
 * all newly classified articles and inserts them into user_queue.
 */

import { db } from '@/db'
import {
  articles,
  articleClassifications,
  userProfiles,
  userPreferences,
  userQueue,
} from '@/db/schema'
import { eq, and, isNull, desc, gt, sql } from 'drizzle-orm'

/**
 * Score a single article for a user based on their preference weights.
 *
 * score = Σ(user_weight × tag_match) × global_score_multiplier × recency_boost
 */
function computeScore(
  articleTags: string[],
  globalScore: number,
  publishedAt: Date | null,
  weights: Record<string, number>,
) {
  // Sum weights for matching tags
  // If user has preferences, unknown tags default to 30 (below neutral)
  // If user has no preferences at all, everything defaults to 50
  const hasPreferences = Object.keys(weights).length > 0
  const defaultWeight = hasPreferences ? 30 : 50

  let tagScore = 0
  for (const tag of articleTags) {
    tagScore += weights[tag] ?? defaultWeight
  }

  // Normalize by number of tags to prevent articles with more tags scoring higher
  const avgTagScore = articleTags.length > 0 ? tagScore / articleTags.length : defaultWeight

  // Global score multiplier (0.0 - 1.0)
  const globalMultiplier = globalScore / 100

  // Recency boost: decays linearly over 7 days (168 hours)
  let recencyBoost = 1
  if (publishedAt) {
    const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60)
    recencyBoost = Math.max(0, 1 - hoursAgo / 168)
  }

  return avgTagScore * globalMultiplier * recencyBoost
}

/**
 * Populate queue for all active users with newly classified articles.
 *
 * "Newly classified" = articles in article_classifications that don't yet
 * have a row in user_queue for that user.
 */
export async function populateQueueForAllUsers() {
  // Get all users
  const users = await db.select({ id: userProfiles.id }).from(userProfiles)

  if (users.length === 0) return { usersProcessed: 0, totalInserted: 0 }

  let totalInserted = 0

  for (const user of users) {
    const inserted = await populateQueueForUser(user.id)
    totalInserted += inserted
  }

  return { usersProcessed: users.length, totalInserted }
}

/**
 * Populate queue for a single user.
 * Finds classified articles not yet in their queue and inserts with scores.
 */
export async function populateQueueForUser(userId: string) {
  // Get user's preference weights
  const prefs = await db
    .select({ tag: userPreferences.tag, weight: userPreferences.weight })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))

  const weights: Record<string, number> = {}
  for (const p of prefs) {
    weights[p.tag] = p.weight
  }

  // Find classified articles not yet in this user's queue
  // Only consider articles from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const newArticles = await db
    .select({
      articleId: articles.id,
      publishedAt: articles.publishedAt,
      tags: articleClassifications.tags,
      globalScore: articleClassifications.globalScore,
    })
    .from(articles)
    .innerJoin(articleClassifications, eq(articles.id, articleClassifications.articleId))
    .leftJoin(
      userQueue,
      and(
        eq(articles.id, userQueue.articleId),
        eq(userQueue.userId, userId),
      ),
    )
    .where(
      and(
        isNull(userQueue.id),
        gt(articles.createdAt, sevenDaysAgo),
      ),
    )
    .orderBy(desc(articles.createdAt))
    .limit(200)

  if (newArticles.length === 0) return 0

  // Compute scores and insert
  const queueEntries = newArticles.map((a) => ({
    userId,
    articleId: a.articleId,
    score: computeScore(a.tags, a.globalScore, a.publishedAt, weights),
  }))

  // Batch insert, skip duplicates
  for (const entry of queueEntries) {
    await db
      .insert(userQueue)
      .values(entry)
      .onConflictDoNothing()
  }

  return queueEntries.length
}

/**
 * Recalculate scores for all pending queue items for a user.
 * Called when user updates their preference weights in settings.
 */
export async function recalculateQueueForUser(userId: string) {
  const prefs = await db
    .select({ tag: userPreferences.tag, weight: userPreferences.weight })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))

  const weights: Record<string, number> = {}
  for (const p of prefs) {
    weights[p.tag] = p.weight
  }

  // Get all pending queue items with their article data
  const pendingItems = await db
    .select({
      queueId: userQueue.id,
      publishedAt: articles.publishedAt,
      tags: articleClassifications.tags,
      globalScore: articleClassifications.globalScore,
    })
    .from(userQueue)
    .innerJoin(articles, eq(userQueue.articleId, articles.id))
    .innerJoin(articleClassifications, eq(articles.id, articleClassifications.articleId))
    .where(and(eq(userQueue.userId, userId), eq(userQueue.status, 'pending')))

  let updated = 0
  for (const item of pendingItems) {
    const newScore = computeScore(item.tags, item.globalScore, item.publishedAt, weights)
    await db
      .update(userQueue)
      .set({ score: newScore })
      .where(eq(userQueue.id, item.queueId))
    updated++
  }

  return updated
}
