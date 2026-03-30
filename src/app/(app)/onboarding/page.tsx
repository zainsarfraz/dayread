/**
 * Onboarding page — shown to new users on first login.
 *
 * Users pick interest areas to seed their preference weights.
 * Skipping sets all weights to neutral (50).
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Cpu,
  Code,
  FileText,
  GitBranch,
  Globe,
  Shield,
  Layers,
  Wrench,
} from 'lucide-react'

const INTEREST_OPTIONS = [
  {
    id: 'llm-releases',
    label: 'New LLM Releases',
    description: 'Model launches, benchmarks, capabilities',
    icon: Cpu,
    tags: { 'llm-release': 80, 'benchmark': 70, 'model-training': 65 },
  },
  {
    id: 'coding-tools',
    label: 'Coding Tools & DX',
    description: 'AI coding assistants, dev tools, IDEs',
    icon: Code,
    tags: { 'coding-tool': 80, 'developer-tools': 75, 'agents': 70 },
  },
  {
    id: 'research',
    label: 'AI Research Papers',
    description: 'Arxiv papers, breakthroughs, architectures',
    icon: FileText,
    tags: { 'research-paper': 80, 'ai-architecture': 75, 'benchmark': 65 },
  },
  {
    id: 'open-source',
    label: 'Open Source AI',
    description: 'Open models, libraries, community tools',
    icon: GitBranch,
    tags: { 'open-source': 80, 'framework': 70, 'fine-tuning': 65 },
  },
  {
    id: 'industry',
    label: 'AI Industry & Startups',
    description: 'Funding, launches, acquisitions, trends',
    icon: Globe,
    tags: { 'startup': 75, 'funding': 70, 'product-launch': 80, 'industry': 70 },
  },
  {
    id: 'safety',
    label: 'AI Safety & Policy',
    description: 'Regulation, alignment, governance',
    icon: Shield,
    tags: { 'ai-safety': 80, 'ai-policy': 75 },
  },
  {
    id: 'infra',
    label: 'MLOps & Infrastructure',
    description: 'Training infra, deployment, serving',
    icon: Layers,
    tags: { 'mlops': 80, 'inference': 75, 'hardware': 70, 'data-engineering': 65 },
  },
  {
    id: 'web-dev',
    label: 'Web Dev & Frameworks',
    description: 'React, Next.js, new frameworks, web tools',
    icon: Wrench,
    tags: { 'web-dev': 80, 'framework': 75, 'developer-tools': 70 },
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleContinue = async () => {
    setSaving(true)

    // Merge tag weights from all selected interests
    const tagWeights: Record<string, number> = {}
    for (const option of INTEREST_OPTIONS) {
      if (selected.has(option.id)) {
        for (const [tag, weight] of Object.entries(option.tags)) {
          // Take the highest weight if a tag appears in multiple interests
          tagWeights[tag] = Math.max(tagWeights[tag] ?? 0, weight)
        }
      }
    }

    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagWeights }),
    })

    router.push('/queue')
  }

  const handleSkip = async () => {
    setSaving(true)
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagWeights: {} }),
    })
    router.push('/queue')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="max-w-xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Personalize
        </p>
        <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-text-primary sm:text-4xl">
          What interests you?
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          Pick a few topics to shape your queue. You can always adjust these later in settings.
        </p>
      </div>

      <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {INTEREST_OPTIONS.map((option) => {
          const isSelected = selected.has(option.id)
          const Icon = option.icon
          return (
            <button
              key={option.id}
              onClick={() => toggle(option.id)}
              className={clsx(
                'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                isSelected
                  ? 'border-accent bg-accent-muted'
                  : 'border-border bg-surface hover:bg-surface-hover',
              )}
            >
              <div
                className={clsx(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  isSelected ? 'bg-accent text-white' : 'bg-surface-hover text-text-tertiary',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p
                  className={clsx(
                    'font-medium',
                    isSelected ? 'text-text-primary' : 'text-text-primary',
                  )}
                >
                  {option.label}
                </p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {option.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={handleContinue}
          disabled={saving}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? 'Setting up...' : `Continue${selected.size > 0 ? ` (${selected.size} selected)` : ''}`}
        </button>
        <button
          onClick={handleSkip}
          disabled={saving}
          className="rounded-md px-4 py-2.5 text-sm text-text-tertiary transition-colors hover:text-text-secondary disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
