/**
 * Login page — Google OAuth sign-in via Supabase Auth.
 */

'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const handleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted">
          <div className="h-3 w-3 rounded-full bg-accent" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Welcome to dayread
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Sign in to start your personalized reading queue
        </p>

        <button
          onClick={handleSignIn}
          className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary transition-all hover:bg-surface-hover hover:shadow-sm"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="mt-6 text-xs leading-relaxed text-text-tertiary">
          By continuing, you agree to let Dayread store your reading
          preferences and activity to personalize your experience.
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
