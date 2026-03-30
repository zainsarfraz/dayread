/**
 * HuggingFace Daily Papers adapter.
 *
 * Fetches trending ML/AI papers with community upvotes and AI-generated summaries.
 */

import type { ParsedArticle } from './types'

type HFPaper = {
  paper: {
    id: string
    title: string
    summary: string
    publishedAt: string
    authors: { name: string }[]
  }
  title: string
  numUpvotes: number
}

export async function pollHuggingFace(): Promise<ParsedArticle[]> {
  const res = await fetch('https://huggingface.co/api/daily_papers', {
    signal: AbortSignal.timeout(30_000),
    headers: { 'User-Agent': 'Dayread/1.0' },
  })

  const papers: HFPaper[] = await res.json()

  return papers.map((p) => ({
    title: p.paper.title,
    url: `https://huggingface.co/papers/${p.paper.id}`,
    description: p.paper.summary?.slice(0, 500) ?? null,
    author: p.paper.authors?.[0]?.name ?? null,
    publishedAt: p.paper.publishedAt ?? null,
  }))
}
