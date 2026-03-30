# Plan: Deployment

## Status: Not Started

- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Set environment variables in Vercel
- [ ] Create GitHub Actions cron workflow
- [ ] Create CI pipeline (typecheck + lint)
- [ ] Update Supabase + Google OAuth redirect URLs
- [ ] Custom domain (optional)

## Goal

Deploy the app reliably with automated cron jobs for content polling and classification.
Keep costs minimal ($0-8/month).

## Architecture Decisions

- **Hosting**: TBD — Vercel (free) or Railway (~$5-8/month)
- **Cron**: External trigger for polling/classification
- **CI/CD**: GitHub Actions for type checking and linting on PRs
- **Domain**: Optional custom domain later

## Option A: Vercel (Free Tier)

**Pros:**
- Free hosting for Next.js (100K function invocations/month)
- Auto-deploy from GitHub
- Edge network, fast globally
- Preview deployments for PRs

**Cons:**
- Free tier: only 1 cron job/day (need hourly polling)
- Workaround: use GitHub Actions as external cron

**Cron Setup (GitHub Actions):**

```yaml
# .github/workflows/cron-poll.yml
name: Poll Sources
on:
  schedule:
    - cron: '0 */2 * * *'  # every 2 hours
  workflow_dispatch:         # manual trigger
jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger poll
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/poll" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
      - name: Trigger classify
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/classify" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

**Cost: $0/month** (Vercel free + GitHub Actions free minutes)

## Option B: Railway

**Pros:**
- Persistent server (run node-cron natively)
- Simple deploy from GitHub
- No cron workarounds needed
- Generous compute

**Cons:**
- ~$5-8/month after trial credits
- Less edge optimization than Vercel

**Cron Setup (in-app):**

```typescript
// src/lib/cron.ts
import cron from 'node-cron'

// Poll every 2 hours
cron.schedule('0 */2 * * *', async () => {
  await pollSources()
  await classifyArticles()
})
```

**Cost: ~$5-8/month**

## Recommendation

**Start with Vercel + GitHub Actions cron.** It's free and works well. Migrate to
Railway only if the GitHub Actions workaround becomes unreliable.

## Environment Setup

### Vercel

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → Select repo
3. Framework: Next.js (auto-detected)
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `CRON_SECRET`
5. Deploy

### GitHub Actions Secrets

Go to repo → Settings → Secrets and variables → Actions:
- `APP_URL`: your Vercel deployment URL (e.g., `https://dayread.vercel.app`)
- `CRON_SECRET`: same secret as in Vercel env vars

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
```

## Custom Domain (Optional, Later)

1. Buy `dayread.app` or `dayread.io` (if available)
2. Add to Vercel → Settings → Domains
3. Update DNS records as instructed
4. Update Supabase redirect URLs
5. Update Google OAuth redirect URIs

## Monitoring

- **Vercel**: built-in function logs and analytics
- **Supabase**: built-in database metrics and logs
- **Cron health**: GitHub Actions logs show poll/classify results
- **Error alerting**: add Sentry later if needed (not for MVP)

## Implementation Steps

1. Initialize Git repo
2. Push to GitHub
3. Deploy to Vercel (USER ACTION — see above)
4. Set up GitHub Actions cron workflow
5. Set environment variables in Vercel
6. Set GitHub Actions secrets
7. Verify cron triggers work
8. Set up CI pipeline

## User Actions Required

### 1. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `dayread`
3. Visibility: Private (or Public if you want)
4. Don't initialize with README (we'll push existing code)
5. Create repository

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import the `dayread` repo
4. Add all environment variables (see Environment Setup above)
5. Click Deploy

### 3. Configure GitHub Actions

After deploying to Vercel:
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add `APP_URL` secret (your Vercel URL)
3. Add `CRON_SECRET` secret (same as Vercel env var)
4. The cron workflow file will auto-run on schedule

### 4. Update Supabase Redirect URLs

After getting your Vercel URL:
1. Go to Supabase dashboard → Authentication → URL Configuration
2. Add your Vercel URL to Redirect URLs:
   - `https://your-app.vercel.app/auth/callback`
3. Update Site URL to your Vercel URL

### 5. Update Google OAuth

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your OAuth client
3. Add to Authorized JavaScript origins:
   - `https://your-app.vercel.app`
4. Add to Authorized redirect URIs:
   - `https://your-app.vercel.app/auth/callback`
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
