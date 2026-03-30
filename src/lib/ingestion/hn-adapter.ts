/**
 * Hacker News adapter.
 *
 * Fetches top stories via the Firebase API, filters by score > 100,
 * and returns the top 30 as ParsedArticles.
 */

import type { ParsedArticle } from './types'

const HN_API = 'https://hacker-news.firebaseio.com/v0'

type HNItem = {
  id: number
  title: string
  url?: string
  score: number
  by: string
  time: number
  descendants?: number
}

export async function pollHackerNews(): Promise<ParsedArticle[]> {
  const res = await fetch(`${HN_API}/topstories.json`, { signal: AbortSignal.timeout(30_000) })
  const storyIds: number[] = await res.json()

  // Fetch top 50 stories in parallel (batches of 10)
  const top50 = storyIds.slice(0, 50)
  const items = await Promise.allSettled(
    top50.map(async (id) => {
      const r = await fetch(`${HN_API}/item/${id}.json`, { signal: AbortSignal.timeout(10_000) })
      return r.json() as Promise<HNItem>
    }),
  )

  return items
    .filter((r): r is PromiseFulfilledResult<HNItem> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((item) => item.score > 100 && item.url)
    .slice(0, 30)
    .map((item) => ({
      title: item.title,
      url: item.url!,
      description: `Score: ${item.score} | ${item.descendants ?? 0} comments on Hacker News`,
      author: item.by,
      publishedAt: new Date(item.time * 1000).toISOString(),
    }))
}
