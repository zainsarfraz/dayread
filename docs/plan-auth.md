# Plan: Authentication

## Goal

Google OAuth sign-in via Supabase Auth. Users sign in, get a profile, and access
their personalized queue.

## Architecture Decisions

- **Supabase Auth** (not NextAuth) — integrated with the database, handles sessions,
  provides RLS context via `auth.uid()`
- **Google OAuth** as the only provider (simple, most users have Google)
- **Server-side session validation** via Supabase SSR helpers
- **Middleware** for route protection (redirect unauthenticated users to login)

## Auth Flow

```
User clicks "Sign in with Google"
  → Supabase Auth redirects to Google consent screen
  → User grants permission
  → Google redirects back to /auth/callback
  → Supabase exchanges code for session
  → Server creates user_profile if first login (via DB trigger or callback)
  → User lands on /queue (their personalized reading queue)
```

## Route Protection

```
Public routes (no auth required):
  /                    — Landing page
  /auth/login          — Login page
  /auth/callback       — OAuth callback handler

Protected routes (auth required):
  /queue               — Daily reading queue
  /article/[id]        — Article detail + summary
  /sources             — Browse/manage sources
  /stats               — Reading statistics
  /settings            — User preferences and account
```

## Implementation Steps

1. Configure Google OAuth in Supabase (USER ACTION — see below)
2. Install `@supabase/ssr` for Next.js server-side auth
3. Create Supabase client utilities:
   - `createServerClient` — for server components and server actions
   - `createBrowserClient` — for client components
4. Create auth middleware (`middleware.ts`) for route protection
5. Build login page with Google sign-in button
6. Build `/auth/callback` route handler
7. Create DB trigger: auto-create `user_profiles` row on new auth.users signup
8. Add auth context/provider for client-side session access

## Session Management

- Supabase handles JWT tokens and refresh automatically
- Server components: read session from cookies via `createServerClient`
- Client components: use `createBrowserClient` with `onAuthStateChange` listener
- Middleware: validate session on every protected route request, refresh if needed

## User Actions Required

### 1. Set Up Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing): name it `dayread`
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Name: `Dayread`
7. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - Your production URL (when deployed)
8. Authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
   - Your production callback URL (when deployed)
9. Click **Create** and note the **Client ID** and **Client Secret**

### 2. Configure Google Provider in Supabase

1. Go to Supabase dashboard → **Authentication → Providers**
2. Find **Google** and enable it
3. Paste your **Client ID** and **Client Secret** from step 1
4. Save

### 3. Configure Redirect URLs in Supabase

1. Go to Supabase dashboard → **Authentication → URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for dev)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - Your production callback URL (when deployed)

### 4. OAuth Consent Screen (Google Cloud)

1. In Google Cloud Console → **APIs & Services → OAuth consent screen**
2. User type: **External**
3. App name: `Dayread`
4. User support email: your email
5. Scopes: just email and profile (default)
6. Test users: add your email (while in testing mode)
7. Save

Note: While the app is in "Testing" mode, only test users can sign in.
When ready for others, submit for verification or publish.
