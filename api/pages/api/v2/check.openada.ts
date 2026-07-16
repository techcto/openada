import type { NextApiRequest, NextApiResponse } from 'next'
import {
  applyCors,
  enforceApiKey,
  handleOptions,
  readStringParam,
  requirePost,
} from '@lib/openada/http'
import { checkLanguage } from '@lib/openada/language'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)

  if (!requirePost(req, res)) return
  if (!enforceApiKey(req, res)) return

  const text = readStringParam(req.body?.text).slice(0, 20000)
  const language = readStringParam(req.body?.language, 'en-US')

  if (!text.trim()) {
    res.status(400).json({
      error: {
        code: 'missing_text',
        message: 'The text field is required.',
      },
    })
    return
  }

  const result = await checkLanguage(text, language)
  res.status(200).json(result)
}
