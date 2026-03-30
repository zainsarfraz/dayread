/**
 * Cron endpoint: Populate user queues with newly classified articles.
 *
 * Called after classification. Computes personalized scores and inserts
 * articles into each user's queue.
 */

import { NextResponse } from 'next/server'
import { populateQueueForAllUsers } from '@/lib/scoring/populate-queue'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await populateQueueForAllUsers()

  return NextResponse.json(result)
}
