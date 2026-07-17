import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const token = String(process.env.OPENAI_APPS_CHALLENGE_TOKEN || '').trim()
  if (!token) {
    res.status(404).end()
    return
  }
  res.status(200).setHeader('Content-Type', 'text/plain; charset=utf-8').send(token)
}
