import type { NextApiRequest, NextApiResponse } from 'next'
import { applyCors, enforceApiKey, handleOptions } from '@lib/openada/http'
import { supportedLanguages } from '@lib/openada/language'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)

  if (!enforceApiKey(req, res)) return

  res.status(200).json(supportedLanguages)
}
