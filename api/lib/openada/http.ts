import type { NextApiRequest, NextApiResponse } from 'next'

export type ApiError = {
  error: {
    code: string
    message: string
  }
}

const parseAllowedOrigins = () => String(process.env.OPENADA_CORS_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export function applyCors(req: NextApiRequest, res: NextApiResponse) {
  const origins = parseAllowedOrigins()
  const requestOrigin = String(req.headers.origin || '')
  const allowOrigin = origins.includes('*')
    ? '*'
    : origins.includes(requestOrigin)
      ? requestOrigin
      : origins[0] || ''

  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-API-Key')
  res.setHeader('Access-Control-Max-Age', '86400')
}

export function handleOptions(req: NextApiRequest, res: NextApiResponse): boolean {
  if (req.method !== 'OPTIONS') return false
  applyCors(req, res)
  res.status(204).end()
  return true
}

export function enforceApiKey(req: NextApiRequest, res: NextApiResponse<ApiError>): boolean {
  const configuredKeys = String(process.env.OPENADA_API_KEYS || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)

  if (configuredKeys.length === 0) return true

  const authorization = String(req.headers.authorization || '')
  const bearer = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : ''
  const apiKey = String(req.headers['x-api-key'] || '').trim()

  if (configuredKeys.includes(bearer) || configuredKeys.includes(apiKey)) {
    return true
  }

  res.status(401).json({
    error: {
      code: 'unauthorized',
      message: 'A valid OpenADA API key is required.',
    },
  })

  return false
}

export function readStringParam(value: unknown, fallback = ''): string {
  if (Array.isArray(value)) return String(value[0] ?? fallback)
  if (value === undefined || value === null) return fallback
  return String(value)
}

export function requirePost(req: NextApiRequest, res: NextApiResponse<ApiError>): boolean {
  if (req.method === 'POST') return true

  res.status(405).json({
    error: {
      code: 'method_not_allowed',
      message: 'Use POST for this endpoint.',
    },
  })

  return false
}
