/**
 * Normalize a URL for deduplication.
 *
 * Strips tracking params (utm_*, ref, etc.), trailing slashes,
 * and normalizes protocol to https.
 */

const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid',
])

export function normalizeUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl)
    url.protocol = 'https:'

    // Remove tracking params
    for (const param of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(param)) {
        url.searchParams.delete(param)
      }
    }

    // Remove trailing slash
    url.pathname = url.pathname.replace(/\/+$/, '') || '/'

    // Remove fragment
    url.hash = ''

    return url.toString()
  } catch {
    return rawUrl
  }
}
