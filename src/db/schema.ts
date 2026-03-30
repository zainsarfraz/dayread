/**
 * Drizzle ORM schema for Dayread.
 *
 * Global tables: sources, articles, article_classifications, article_summaries
 * Per-user tables: user_profiles, user_preferences, user_queue, user_actions
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  real,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

// ── Global Tables ──

export const sources = pgTable('sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  url: text('url').notNull(),
  type: text('type').notNull(), // 'rss' | 'api'
  iconUrl: text('icon_url'),
  pollInterval: integer('poll_interval').notNull().default(7200),
  active: boolean('active').notNull().default(true),
  lastPolledAt: timestamp('last_polled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => sources.id),
    title: text('title').notNull(),
    url: text('url').notNull(),
    description: text('description'),
    author: text('author'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_articles_url').on(table.url),
    index('idx_articles_source_published').on(table.sourceId, table.publishedAt),
  ],
)

export const articleClassifications = pgTable(
  'article_classifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    articleId: uuid('article_id')
      .notNull()
      .unique()
      .references(() => articles.id),
    tags: text('tags').array().notNull(),
    hook: text('hook').notNull(),
    category: text('category').notNull(), // 'research' | 'tool' | 'industry' | 'tutorial' | 'opinion'
    globalScore: integer('global_score').notNull(),
    classifiedAt: timestamp('classified_at', { withTimezone: true }).notNull().defaultNow(),
    modelVersion: text('model_version').notNull(),
  },
  (table) => [index('idx_classifications_tags').using('gin', table.tags)],
)

export const articleSummaries = pgTable('article_summaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id')
    .notNull()
    .unique()
    .references(() => articles.id),
  summary: text('summary').notNull(),
  keyPoints: text('key_points').array(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  modelVersion: text('model_version').notNull(),
})

// ── Per-User Tables ──

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey(), // FK to auth.users.id
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  onboarded: boolean('onboarded').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id),
    tag: text('tag').notNull(),
    weight: real('weight').notNull().default(50),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('idx_user_preferences_user_tag').on(table.userId, table.tag)],
)

export const userQueue = pgTable(
  'user_queue',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id),
    score: real('score').notNull(),
    status: text('status').notNull().default('pending'), // 'pending' | 'read' | 'skipped' | 'bookmarked'
    queuedAt: timestamp('queued_at', { withTimezone: true }).notNull().defaultNow(),
    actedAt: timestamp('acted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('idx_user_queue_user_article').on(table.userId, table.articleId),
    index('idx_user_queue_user_status').on(table.userId, table.status),
    index('idx_user_queue_user_score').on(table.userId, table.score),
  ],
)

export const userActions = pgTable(
  'user_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id),
    action: text('action').notNull(), // 'view' | 'read' | 'skip' | 'bookmark' | 'unbookmark' | 'click_source'
    timeSpentMs: integer('time_spent_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_user_actions_user_created').on(table.userId, table.createdAt)],
)
