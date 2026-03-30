/**
 * Landing page — shown to non-authenticated visitors.
 *
 * Minimal, warm, inviting. One clear CTA.
 */

import Link from 'next/link'
import { Zap, Clock, Brain } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-8">
        <span className="text-lg font-semibold text-text-primary">dayread</span>
        <Link
          href="/auth/login"
          className="rounded-md border border-border px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <div className="max-w-xl text-center">
          {/* Accent dot */}
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted">
            <div className="h-3 w-3 rounded-full bg-accent" />
          </div>

          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-text-primary sm:text-5xl">
            Stay sharp on AI & tech.
            <br />
            <span className="text-text-secondary">Without the noise.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-text-secondary">
            Dayread pulls from the best sources, scores what matters to you,
            and serves it one article at a time. Read the gist in 2 minutes,
            or dive into the original.
          </p>

          <Link
            href="/auth/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-accent-hover hover:shadow-lg"
          >
            Get started — it&apos;s free
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
          <Feature
            icon={Zap}
            title="AI-curated queue"
            description="10 sources polled, every article classified and scored for you"
          />
          <Feature
            icon={Clock}
            title="Paced for humans"
            description="No infinite feed. Read one thing, mark it done, move on"
          />
          <Feature
            icon={Brain}
            title="Learns your taste"
            description="Every read, skip, and bookmark trains your personal scoring"
          />
        </div>

        {/* Source logos hint */}
        <div className="mt-16 text-center">
          <p className="text-xs uppercase tracking-widest text-text-tertiary">Sources include</p>
          <p className="mt-2 text-sm text-text-secondary">
            Hacker News · ArXiv · HuggingFace · TechCrunch · Reddit · Simon Willison · and more
          </p>
        </div>
      </div>
    </main>
  )
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Zap
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-text-tertiary">{description}</p>
    </div>
  )
}
