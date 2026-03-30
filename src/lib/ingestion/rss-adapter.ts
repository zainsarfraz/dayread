/**
 * Generic RSS/Atom feed adapter.
 *
 * Uses rss-parser to fetch and parse any standard RSS or Atom feed.
 * Works for most sources (Simon Willison, TLDR AI, TechCrunch, OpenAI, etc.)
 */

import Parser from 'rss-parser'
import type { ParsedArticle } from './types'

const parser = new Parser({
  timeout: 30_000,
  headers: {
    'User-Agent': 'Dayread/1.0 (personal news aggregator)',
  },
})

export async function pollRss(feedUrl: string): Promise<ParsedArticle[]> {
  const feed = await parser.parseURL(feedUrl)

  return (feed.items ?? []).map((item) => ({
    title: item.title ?? 'Untitled',
    url: item.link ?? '',
    description: item.contentSnippet ?? item.content ?? null,
    author: item.creator ?? item.author ?? null,
    publishedAt: item.isoDate ?? item.pubDate ?? null,
  })).filter((item) => item.url)
}
