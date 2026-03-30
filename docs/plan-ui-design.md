# Plan: UI Design

## Status: 90% Built

- [x] Design system (dark-first, warm amber accent, Tailwind v4)
- [x] Landing page (editorial style, staggered animations)
- [x] Login page (Google OAuth, accent branding)
- [x] Queue page (spotlight + compact cards, entrance animations)
- [x] Article detail (serif title, AI summary, feedback, mark-as-read)
- [x] Bookmarks page
- [x] History page
- [x] Stats page (streak grid, charts, progress bars)
- [x] Settings page (preference sliders, source toggles)
- [x] Onboarding page (interest selection cards)
- [x] Nav bar (desktop + mobile hamburger, sticky, backdrop blur)
- [x] Animations (rise, stagger, grow, fade-in, reduced-motion)
- [ ] Mobile responsive testing
- [ ] Component extraction (reusable primitives)

## Goal

A minimal, modern, and unique reading interface that doesn't look AI-generated.
Users should want to stay on the app — calm, focused, beautiful.

## Design Philosophy

**Dayread is not a dashboard. It's a reading companion.**

The design draws from:
- **iA Writer** — distraction-free, typography-first
- **Linear** — polished interactions, purposeful animations
- **Things 3** — satisfying task completion, subtle delight
- **A well-curated bookshop** — warm, inviting, curated

### Anti-Patterns (what to avoid)

- Generic shadcn/Tailwind "startup template" look
- Card grids that look like every other SaaS dashboard
- Aggressive CTAs, badges, and notification counts
- Cluttered navigation with too many options
- Cookie-cutter light-gray backgrounds with white cards

## Design Tokens

### Colors

```
-- Dark mode (primary) --
background:       #0A0A0C (near-black with slight blue undertone)
surface:          #141418 (elevated surfaces)
surface-hover:    #1C1C22 (hover state)
border:           #2A2A32 (subtle borders)
text-primary:     #EDEDEF (off-white, not pure white)
text-secondary:   #8B8B96 (muted text)
text-tertiary:    #56565F (very muted)
accent:           #E8915A (warm amber/coral — the signature color)
accent-hover:     #F0A06E
accent-muted:     rgba(232, 145, 90, 0.15) (for backgrounds)
success:          #4ADE80 (read/completed)
skip:             #64748B (skipped — neutral gray)

-- Light mode --
background:       #FAFAF9 (warm off-white)
surface:          #FFFFFF
surface-hover:    #F5F5F3
border:           #E8E8E4
text-primary:     #1A1A1E
text-secondary:   #6B6B73
text-tertiary:    #9B9BA3
accent:           #D4783E (slightly darker amber for contrast)
```

### Typography

```
-- Fonts --
UI font:          Inter (clean, geometric, great for interfaces)
Content font:     Newsreader or Lora (serif, for article summaries — adds warmth)
Mono font:        JetBrains Mono (for code snippets, tags)

-- Scale (rem) --
text-xs:          0.75rem (12px)  — metadata, timestamps
text-sm:          0.875rem (14px) — secondary text, tags
text-base:        1rem (16px)     — body text
text-lg:          1.125rem (18px) — article descriptions
text-xl:          1.25rem (20px)  — card titles
text-2xl:         1.5rem (24px)   — page titles
text-3xl:         1.875rem (30px) — hero/spotlight titles

-- Line height --
tight:            1.25 (headings)
normal:           1.5 (body)
relaxed:          1.75 (article content — generous for reading)
```

### Spacing

```
4px base grid

xs:    4px     — tight padding within elements
sm:    8px     — between related items
md:    16px    — card padding, section gaps
lg:    24px    — between sections
xl:    32px    — major section breaks
2xl:   48px    — page-level spacing
3xl:   64px    — hero spacing
```

### Radius

```
sm:    4px     — tags, small badges
md:    8px     — cards, buttons
lg:    12px    — modals, panels
full:  9999px  — pills, avatars
```

### Shadows (dark mode — very subtle)

```
sm:    0 1px 2px rgba(0, 0, 0, 0.3)
md:    0 4px 12px rgba(0, 0, 0, 0.4)
lg:    0 8px 24px rgba(0, 0, 0, 0.5)
```

### Transitions

```
fast:     150ms ease-out  — hover states, toggles
normal:   250ms ease-out  — card interactions, reveals
slow:     400ms ease-out  — page transitions, large moves
spring:   500ms cubic-bezier(0.34, 1.56, 0.64, 1)  — satisfying bouncy actions
```

## Pages

### 1. Landing Page (`/`)

Minimal marketing page for non-authenticated users:
- Hero: "Your daily dose of AI & tech. Curated by AI, paced for humans."
- Brief feature highlights (3 items max)
- Single CTA: "Sign in with Google"
- No navbar clutter, no pricing, no testimonials

### 2. Queue Page (`/queue`) — THE core page

This is where users spend 90% of their time.

**Layout:**
```
┌──────────────────────────────────────────┐
│  [logo]  Queue  Bookmarks  Stats    [av] │ ← minimal top nav
├──────────────────────────────────────────┤
│                                          │
│  Good morning, Zain.                     │ ← personalized greeting
│  You have 12 articles today.             │
│  🔥 3-day streak                         │ ← streak indicator
│                                          │
│  ┌─ TODAY'S PICK ──────────────────────┐ │
│  │                                     │ │ ← spotlight card (larger)
│  │  "OpenAI releases GPT-5 Nano..."   │ │
│  │  This is a game-changer for...      │ │
│  │                                     │ │
│  │  [TechCrunch] · 2h ago · Score: 94  │ │
│  │  #llm-release #product-launch       │ │
│  │                                     │ │
│  │  [Read]  [Bookmark]  [Skip]         │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ── Up Next ──                           │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ 2. "New coding agent..."  [HN] 3h  │ │ ← regular cards (compact)
│  │    Game-changing OSS release...     │ │
│  │    [Read] [Bookmark] [Skip]         │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │ 3. "Transformer alternative..."     │ │
│  │    ...                              │ │
│  └─────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

**Unique interactions:**
- Spotlight card has a subtle gradient border (accent color)
- Cards slide out left when skipped (with a gentle spring animation)
- Cards slide out right when bookmarked (with a bookmark icon trail)
- Reading a card shows a progress ring filling (estimated read time)
- Queue number badges pulse subtly when new articles arrive

### 3. Article Detail (`/article/[id]`)

Full reading experience:

```
┌──────────────────────────────────────────┐
│  ← Back to Queue              [Bookmark] │
├──────────────────────────────────────────┤
│                                          │
│  [TechCrunch favicon] TechCrunch         │ ← source pill
│                                          │
│  GPT-5 Nano: OpenAI's Cheapest           │ ← title (serif, large)
│  Model Yet Changes the Game              │
│                                          │
│  2 hours ago · 4 min read                │ ← metadata
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  [AI Summary]                            │ ← summary (serif, relaxed spacing)
│                                          │
│  OpenAI has released GPT-5 Nano, their   │
│  smallest and cheapest model to date...  │
│                                          │
│  Key Takeaways                           │
│  • Point one...                          │ ← bullet points
│  • Point two...                          │
│  • Point three...                        │
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  [Read full article →]                   │ ← link to original source
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  Was this useful?  [👍]  [👎]            │ ← feedback (updates preferences)
│                                          │
└──────────────────────────────────────────┘
```

**Unique elements:**
- Summary paragraphs fade in one by one (subtle, not distracting)
- Serif font for article content creates a "reading mode" feel
- Generous line height (1.75) and max-width (680px) for readability
- Progress bar at top shows scroll progress
- "Read full article" button is prominent but not aggressive

### 4. Stats Page (`/stats`)

Reading analytics dashboard (see plan-stats-and-analytics.md for details).

### 5. Settings Page (`/settings`)

- Profile info (from Google)
- Interest/tag weight sliders
- Source enable/disable toggles
- Theme toggle (dark/light)
- Account actions (sign out, delete account)

### 6. Onboarding (`/onboarding`)

First-time user flow:
- Full-screen, focused
- "Pick your interests" — grid of interest cards with icons
- Each card is toggleable (selected state = accent border + check)
- "Continue" button → redirect to /queue
- Can skip (all weights set to neutral 50)

## Components

### Core Components to Build

1. **ArticleCard** — compact card for queue list
2. **SpotlightCard** — larger featured card for "Today's Pick"
3. **ArticleDetail** — full reading view with summary
4. **TagPill** — small colored pill for category tags
5. **SourceBadge** — favicon + source name
6. **ScoreBadge** — relevance score indicator
7. **StreakCounter** — flame icon + day count
8. **ProgressRing** — circular progress indicator
9. **ActionBar** — read/bookmark/skip buttons
10. **NavBar** — minimal top navigation
11. **InterestCard** — toggleable card for onboarding
12. **EmptyState** — illustration + message when queue is empty
13. **ThemeToggle** — dark/light mode switch
14. **SkeletonCard** — loading placeholder

### No Component Library

All components are hand-crafted with Tailwind CSS. No shadcn/ui, no Radix,
no headless UI libraries. This ensures a unique visual identity.

Exception: may use Radix primitives (Dialog, Tooltip) for accessibility
if building from scratch would compromise a11y.

## Responsive Design

- **Mobile-first** — queue page must work beautifully on phone
- **Breakpoints**: sm (640px), md (768px), lg (1024px)
- **Mobile**: single column, cards stack vertically, swipe gestures for skip/bookmark
- **Desktop**: centered content column (max-width 720px), generous side margins

## Animations

- **Card dismiss (skip)**: slide left + fade out (250ms ease-out)
- **Card bookmark**: slide right + scale down slightly (250ms ease-out)
- **Card enter**: fade in + slide up from 10px below (200ms ease-out, staggered 50ms)
- **Summary reveal**: paragraphs fade in sequentially (200ms each, 100ms delay between)
- **Score badge**: number counts up from 0 on mount (400ms)
- **Streak flame**: subtle pulse animation (infinite, very slow — 3s cycle)
- **Page transitions**: cross-fade (200ms)
- **Hover states**: background color shift (150ms ease-out)

## Implementation Steps

1. Set up Tailwind CSS v4 with design tokens (colors, fonts, spacing)
2. Install Inter + Newsreader/Lora fonts
3. Build base layout (nav, content area, responsive shell)
4. Build ArticleCard and SpotlightCard components
5. Build Queue page
6. Build Article Detail page
7. Build Onboarding page
8. Build Settings page
9. Build Stats page (see stats plan)
10. Add animations and transitions
11. Add dark/light theme support
12. Mobile responsive pass
13. Polish and micro-interactions

## User Actions Required

None — this module is fully code-driven. No external setup needed.
