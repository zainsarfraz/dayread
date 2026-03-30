# Dev Setup

Set up the development environment from scratch:

1. Run `pnpm install`
2. Check that `.env.local` exists and has all required vars (compare with `.env.example`)
3. Run `pnpm db:push` to push schema to Supabase
4. Run `pnpm tsx src/db/seed.ts` to seed sources (if empty)
5. Run `pnpm dev` to start the dev server
6. Report the status of each step
