import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'ok',
    service: 'openada-api',
    version: '0.1.0',
  })
}
