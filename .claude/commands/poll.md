# Manual Poll

Trigger a manual content poll and classification:

1. Read the CRON_SECRET from `.env.local`
2. Run: `curl -X POST http://localhost:3000/api/cron/poll -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json"`
3. Show the response (how many articles were fetched per source)
4. Run: `curl -X POST http://localhost:3000/api/cron/classify -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json"`
5. Show the classification response
6. Summarize: total new articles, total classified, any errors

Note: The dev server must be running (`pnpm dev`) for this to work.
