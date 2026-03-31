/**
 * Reddit adapter for r/LocalLLaMA.
 *
 * Fetches top posts of the day via Reddit's JSON API.
 * Filters by score > 50. Handles rate limiting and HTML error pages.
 */

import type { ParsedArticle } from './types'

export async function pollReddit(): Promise<ParsedArticle[]> {
  const res = await fetch('https://www.reddit.com/r/LocalLLaMA/top.json?t=day&limit=50', {
    signal: AbortSignal.timeout(30_000),
    headers: {
      'User-Agent': 'Dayread/1.0 (personal news aggregator; contact: github.com/zainsarfraz/dayread)',
    },
  })

  // Reddit sometimes returns HTML error pages instead of JSON
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) {
    throw new Error(`Reddit returned non-JSON response (${res.status}, ${contentType})`)
  }

  if (!res.ok) {
    throw new Error(`Reddit returned ${res.status}`)
  }

  const data = await res.json()
  const posts = data?.data?.children ?? []

  return posts
    .map((child: { data: {
      title: string
      url: string
      selftext: string
      author: string
      score: number
      created_utc: number
      is_self: boolean
      permalink: string
    }}) => child.data)
    .filter((post: { score: number }) => post.score > 50)
    .map((post: {
      title: string
      url: string
      selftext: string
      author: string
      score: number
      created_utc: number
      is_self: boolean
      permalink: string
    }) => ({
      title: post.title,
      url: post.is_self ? `https://reddit.com${post.permalink}` : post.url,
      description: post.selftext?.slice(0, 500) || `Score: ${post.score} on r/LocalLLaMA`,
      author: post.author,
      publishedAt: new Date(post.created_utc * 1000).toISOString(),
    }))
}
