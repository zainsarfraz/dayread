# Add Source

Add a new content source to Dayread.

Arguments: $ARGUMENTS (the source name or URL to add)

Steps:
1. Research the source — does it have an RSS feed or API?
2. Determine the adapter type (rss, api) and feed URL
3. If a custom adapter is needed, create it in `src/lib/ingestion/`
4. Add the source to the database via a quick script
5. Update the poll route if a new adapter slug mapping is needed
6. Update GUIDE.md with the new source
7. Test by running a manual poll
