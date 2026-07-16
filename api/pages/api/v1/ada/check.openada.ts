import type { NextApiRequest, NextApiResponse } from 'next'
import {
  applyCors,
  enforceApiKey,
  handleOptions,
  readStringParam,
  requirePost,
} from '@lib/openada/http'
import { checkAda } from '@lib/openada/ada'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)

  if (!requirePost(req, res)) return
  if (!enforceApiKey(req, res)) return

  const html = readStringParam(req.body?.html).slice(0, 200000)
  const url = readStringParam(req.body?.url, 'https://openada.local/')
  const wcagTags = Array.isArray(req.body?.wcagTags)
    ? req.body.wcagTags
    : readStringParam(req.body?.wcagTags)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

  if (!html.trim()) {
    res.status(400).json({
      error: {
        code: 'missing_html',
        message: 'The html field is required.',
      },
    })
    return
  }

  try {
    const result = await checkAda({ html, url, wcagTags })
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'ada_check_failed',
        message: error instanceof Error ? error.message : 'The ADA check failed.',
      },
    })
  }
}
