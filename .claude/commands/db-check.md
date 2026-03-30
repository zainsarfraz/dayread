# Database Check

Check the current state of the database:

1. Count rows in each table: sources, articles, article_classifications, article_summaries, user_profiles, user_preferences, user_queue, user_actions
2. Show the 5 most recent articles with their source name and classification status
3. Show all active sources with their last_polled_at timestamp
4. Report any issues (unclassified articles, sources never polled, etc.)

Use Drizzle ORM queries via `pnpm tsx -e "..."` with the DATABASE_URL from `.env.local`.
