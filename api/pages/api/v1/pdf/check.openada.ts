import type { NextApiRequest, NextApiResponse } from 'next'
import {
  applyCors,
  enforceApiKey,
  handleOptions,
  readBooleanParam,
  readStringParam,
  requirePost,
} from '@lib/openada/http'
import { checkPdf, decodePdf, MAX_PDF_BYTES } from '@lib/openada/pdf'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)
  if (!requirePost(req, res)) return
  if (!enforceApiKey(req, res)) return

  const file = readStringParam(req.body?.file).trim()
  const filename = readStringParam(req.body?.filename, 'document.pdf').trim() || 'document.pdf'
  const isPrivate = readBooleanParam(req.body?.private, false)

  try {
    const decoded = decodePdf(file)
    if (decoded.length > MAX_PDF_BYTES) throw new Error('The decoded PDF exceeds the 10 MB limit.')
    const result = await checkPdf({ file, filename, private: isPrivate })
    res.status(200).json({ ...result, visibility: isPrivate ? 'private' : 'public' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The PDF check failed.'
    const invalid = message.includes('file field') || message.includes('decoded PDF') || message.includes('not a PDF')
    res.status(invalid ? (message.includes('10 MB') ? 413 : 400) : 502).json({
      error: {
        code: invalid ? (message.includes('10 MB') ? 'pdf_too_large' : 'invalid_pdf') : 'pdf_check_failed',
        message,
      },
    })
  }
}
