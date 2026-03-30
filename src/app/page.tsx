/**
 * Landing page — shown to non-authenticated visitors.
 *
 * Minimal hero with a single CTA to sign in with Google.
 */

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
          dayread
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-text-secondary">
          Your daily dose of AI & tech.
          <br />
          Curated by AI, paced for humans.
        </p>

        <div className="mt-4 flex flex-col gap-3 text-sm text-text-tertiary">
          <p>Smart queue that learns what matters to you</p>
          <p>One article at a time — no doomscrolling</p>
          <p>AI summaries so you get the gist in 2 minutes</p>
        </div>

        <Link
          href="/auth/login"
          className="mt-10 inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-white transition-colors duration-[var(--transition-fast)] hover:bg-accent-hover"
        >
          Get started
        </Link>
      </div>
    </main>
  )
}
