/**
 * AI classification — Pass 1 of the two-pass pipeline.
 *
 * Sends a batch of article titles + descriptions to Gemini,
 * gets back categories, tags, hooks, and global importance scores.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

type ArticleInput = {
  id: string
  title: string
  description: string | null
  sourceName: string
}

type ClassificationResult = {
  articleId: string
  category: string
  tags: string[]
  hook: string
  globalScore: number
}

const SYSTEM_PROMPT = `You are an AI/tech news classifier. For each article, provide:

1. category: one of "research", "tool", "industry", "tutorial", "opinion"
2. tags: 2-5 tags from this list:
   llm-release, coding-tool, ai-architecture, open-source, framework,
   benchmark, ai-safety, ai-policy, startup, funding, product-launch,
   api-update, model-training, inference, fine-tuning, agents,
   multimodal, robotics, hardware, developer-tools, web-dev, mobile,
   data-engineering, mlops, research-paper, explainer, comparison
3. hook: one sentence (max 120 chars) explaining why a tech-savvy developer should care. Be specific, not generic.
4. global_score: 0-100 importance rating:
   - Impact on AI/tech industry (40%)
   - Novelty — is this genuinely new? (30%)
   - Practical relevance to developers (30%)

Respond as a JSON array. Each element must have: article_id, category, tags, hook, global_score.
No markdown, no code fences — just the raw JSON array.`

export async function classifyArticles(articles: ArticleInput[]): Promise<ClassificationResult[]> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  })

  const articlesPayload = articles.map((a) => ({
    article_id: a.id,
    title: a.title,
    description: a.description?.slice(0, 300) ?? '',
    source: a.sourceName,
  }))

  const result = await model.generateContent([
    SYSTEM_PROMPT,
    `Classify these ${articles.length} articles:\n${JSON.stringify(articlesPayload)}`,
  ])

  const text = result.response.text()
  const parsed = JSON.parse(text) as {
    article_id: string
    category: string
    tags: string[]
    hook: string
    global_score: number
  }[]

  return parsed.map((p) => ({
    articleId: p.article_id,
    category: p.category,
    tags: p.tags,
    hook: p.hook,
    globalScore: p.global_score,
  }))
}
