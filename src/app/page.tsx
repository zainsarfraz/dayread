/**
 * Landing page — first impression.
 *
 * Exaggerated minimalism: oversized typography, massive whitespace,
 * warm accent, editorial feel. Content-first, not SaaS-template.
 */

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-bg">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="text-base font-semibold tracking-tight text-text-primary">dayread</span>
        <Link
          href="/auth/login"
          className="rounded-md px-4 py-1.5 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-32 pt-24 sm:px-10 sm:pt-32">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          AI-powered reading
        </p>

        <h1 className="mt-4 font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1.08] tracking-tight text-text-primary">
          The tech news
          <br />
          that matters to
          <br />
          <span className="text-text-tertiary">you</span>.
        </h1>

        <p className="mt-6 max-w-md text-base leading-relaxed text-text-secondary">
          10 sources. AI classification. A queue that learns
          what you care about. Read the gist in two minutes
          or dive into the original.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/auth/login"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-hover"
          >
            Start reading
          </Link>
          <span className="text-sm text-text-tertiary">Free, no credit card</span>
        </div>

        {/* Visual separator */}
        <div className="mt-20 h-px bg-border" />

        {/* How it works */}
        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
          <Step number="01" title="We pull">
            Hacker News, ArXiv, HuggingFace, TechCrunch, Reddit
            and more — polled every 2 hours.
          </Step>
          <Step number="02" title="AI scores">
            Every article gets classified, tagged, and ranked
            by importance. One batch, zero per-user cost.
          </Step>
          <Step number="03" title="You read">
            Your queue learns from every read, skip, and bookmark.
            Tomorrow&apos;s queue is smarter than today&apos;s.
          </Step>
        </div>

        <div className="mt-20 h-px bg-border" />

        {/* Sources */}
        <div className="mt-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-tertiary">
            Sources
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
            {[
              'Hacker News', 'ArXiv', 'HuggingFace', 'TechCrunch',
              'Reddit', 'Simon Willison', 'The Decoder', 'DeepMind',
            ].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="font-mono text-xs text-accent">{number}</span>
      <h3 className="mt-1 text-base font-medium text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{children}</p>
    </div>
  )
}
