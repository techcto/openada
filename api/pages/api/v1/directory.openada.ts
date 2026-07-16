import type { NextApiRequest, NextApiResponse } from 'next'
import { applyCors, handleOptions } from '@lib/openada/http'
import { getSite, listSites } from '@lib/openada/directory'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)

  try {
    if (req.method === 'GET') {
      const siteId = typeof req.query.site === 'string' ? req.query.site.trim().toLowerCase() : ''
      if (siteId) {
        const result = await getSite(siteId)
        if (!result.site) {
          res.status(404).json({ error: { code: 'site_not_found', message: 'That site is not in the directory.' } })
          return
        }
        res.status(200).json(result)
        return
      }

      res.status(200).json({ sites: await listSites() })
      return
    }

    res.status(405).json({ error: { code: 'method_not_allowed', message: 'Use GET for the directory.' } })
  } catch (error) {
    res.status(503).json({
      error: {
        code: 'directory_unavailable',
        message: error instanceof Error ? error.message : 'The public directory is unavailable.',
      },
    })
  }
}
