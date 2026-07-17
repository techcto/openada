import type { NextApiRequest, NextApiResponse } from 'next'
import { applyCors, handleOptions, readStringParam } from '@lib/openada/http'
import { fetchRemoteHtml } from '@lib/openada/remote'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)

  if (req.method !== 'GET') {
    res.status(405).json({ error: { code: 'method_not_allowed', message: 'Use GET for preview checks.' } })
    return
  }

  const url = readStringParam(req.query.url).trim()
  if (!url) {
    res.status(400).json({ error: { code: 'missing_url', message: 'The url query parameter is required.' } })
    return
  }

  try {
    const page = await fetchRemoteHtml(url)
    res.status(200).json({
      url: page.url,
      frameable: page.frameable,
      reason: page.frameBlockReason || null,
    })
  } catch (error) {
    res.status(400).json({
      error: {
        code: 'preview_check_failed',
        message: error instanceof Error ? error.message : 'Unable to check this page preview.',
      },
    })
  }
}
