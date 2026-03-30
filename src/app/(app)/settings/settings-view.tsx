/**
 * Settings view — interactive settings with auto-save.
 */

'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Save, RotateCcw } from 'lucide-react'

type Preference = { tag: string; weight: number }
type Source = {
  id: string
  name: string
  slug: string
  url: string
  iconUrl: string | null
  active: boolean
}

export function SettingsView({
  user,
  preferences,
  sources,
}: {
  user: { name: string; email: string; avatarUrl?: string }
  preferences: Preference[]
  sources: Source[]
}) {
  const [prefs, setPrefs] = useState<Record<string, number>>(
    Object.fromEntries(preferences.map((p) => [p.tag, p.weight])),
  )
  const [sourceStates, setSourceStates] = useState<Record<string, boolean>>(
    Object.fromEntries(sources.map((s) => [s.id, s.active])),
  )
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'recalculating' | 'saved'>('idle')
  // Sort tags once on mount — don't re-sort while dragging sliders
  const [tagOrder] = useState(() =>
    Object.entries(prefs)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag),
  )

  const handleWeightChange = (tag: string, weight: number) => {
    setPrefs((prev) => ({ ...prev, [tag]: weight }))
    setSaveState('idle')
  }

  const handleSourceToggle = (sourceId: string) => {
    setSourceStates((prev) => ({ ...prev, [sourceId]: !prev[sourceId] }))
    setSaveState('idle')
  }

  const handleSave = async () => {
    setSaveState('saving')
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: prefs, sources: sourceStates }),
    })
    setSaveState('recalculating')
    // Small delay so user sees the recalculating state
    await new Promise((r) => setTimeout(r, 500))
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  const handleResetPreferences = () => {
    const reset = Object.fromEntries(Object.keys(prefs).map((tag) => [tag, 50]))
    setPrefs(reset)
    setSaveState('idle')
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === 'saving' || saveState === 'recalculating'}
          className={clsx(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            saveState === 'saved'
              ? 'bg-success/15 text-success'
              : 'bg-accent text-white hover:bg-accent-hover disabled:opacity-70',
          )}
        >
          <Save className="h-4 w-4" />
          {saveState === 'saving' && 'Saving preferences...'}
          {saveState === 'recalculating' && 'Recalculating queue...'}
          {saveState === 'saved' && 'Saved & queue updated!'}
          {saveState === 'idle' && 'Save Changes'}
        </button>
      </div>

      {/* Profile */}
      <div className="mt-8 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Account
        </h2>
        <div className="mt-4 flex items-center gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover text-lg font-medium text-text-secondary">
              {user.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-text-primary">{user.name}</p>
            <p className="text-sm text-text-secondary">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Interest Preferences */}
      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Interest Weights
            </h2>
            <p className="mt-0.5 text-xs text-text-tertiary">
              Higher weight = more articles on this topic in your queue
            </p>
          </div>
          <button
            onClick={handleResetPreferences}
            className="inline-flex items-center gap-1.5 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
          >
            <RotateCcw className="h-3 w-3" />
            Reset all
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {tagOrder.map((tag) => (
            <div key={tag}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-text-primary">{formatTag(tag)}</span>
                <span className="w-8 text-right text-text-tertiary">{Math.round(prefs[tag] ?? 50)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={prefs[tag] ?? 50}
                onChange={(e) => handleWeightChange(tag, Number(e.target.value))}
                className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-hover accent-accent"
              />
            </div>
          ))}
        </div>

        {tagOrder.length === 0 && (
          <p className="mt-4 text-sm text-text-tertiary">
            No preferences yet. Read some articles to build your profile.
          </p>
        )}
      </div>

      {/* Sources */}
      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Sources
        </h2>
        <p className="mt-0.5 text-xs text-text-tertiary">
          Toggle sources on or off. Disabled sources won&apos;t be polled.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-surface-hover"
            >
              <div className="flex items-center gap-3">
                {source.iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={source.iconUrl} alt="" className="h-5 w-5 rounded-full" />
                )}
                <span className="text-sm text-text-primary">{source.name}</span>
              </div>
              <button
                onClick={() => handleSourceToggle(source.id)}
                className={clsx(
                  'relative h-6 w-11 rounded-full transition-colors',
                  sourceStates[source.id] ? 'bg-accent' : 'bg-surface-hover',
                )}
              >
                <span
                  className={clsx(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                    sourceStates[source.id] ? 'left-[22px]' : 'left-0.5',
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}

function formatTag(tag: string) {
  return tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
