/**
 * AI summarization — Pass 2 of the two-pass pipeline.
 *
 * Generates a detailed summary and key takeaways for a single article.
 * Called on demand, cached after first generation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

type SummarizeInput = {
  title: string
  description: string | null
  sourceName: string
}

type SummaryResult = {
  summary: string
  keyPoints: string[]
}

const SYSTEM_PROMPT = `Summarize this AI/tech article for a software developer.

Provide:
1. summary: A clear 3-5 paragraph summary covering what it is, why it matters, and key technical details. Write for a developer who wants to understand this quickly without reading the full article. Use plain language, be specific about technical details.
2. key_points: 3-5 bullet points of the most important takeaways. Each should be a complete, standalone insight.

Respond as JSON with "summary" and "key_points" fields.
No markdown, no code fences — just raw JSON.`

export async function summarizeArticle(input: SummarizeInput): Promise<SummaryResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  })

  const prompt = `Title: ${input.title}\nSource: ${input.sourceName}\nDescription: ${input.description ?? 'No description available'}`

  const result = await model.generateContent([SYSTEM_PROMPT, prompt])
  const text = result.response.text()
  const parsed = JSON.parse(text) as { summary: string; key_points: string[] }

  return {
    summary: parsed.summary,
    keyPoints: parsed.key_points,
  }
}
