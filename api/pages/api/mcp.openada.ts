import type { NextApiRequest, NextApiResponse } from 'next'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createOpenAdaMcpServer } from '@lib/openada/mcp'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '256kb',
    },
  },
}

function authorized(req: NextApiRequest): boolean {
  const keys = String(process.env.OPENADA_API_KEYS || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
  if (keys.length === 0) return true
  const authorization = String(req.headers.authorization || '')
  const bearer = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : ''
  const apiKey = String(req.headers['x-api-key'] || '').trim()
  return keys.includes(bearer) || keys.includes(apiKey)
}

function cors(req: NextApiRequest, res: NextApiResponse) {
  const origins = String(process.env.OPENADA_CORS_ORIGINS || '*').split(',').map((origin) => origin.trim()).filter(Boolean)
  const requestOrigin = String(req.headers.origin || '')
  const origin = origins.includes('*') ? '*' : origins.includes(requestOrigin) ? requestOrigin : origins[0] || ''
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-API-Key,Mcp-Session-Id')
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  cors(req, res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (!authorized(req)) {
    res.status(401).json({ error: { code: 'unauthorized', message: 'A valid OpenADA API key is required.' } })
    return
  }
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST, OPTIONS').json({ error: { code: 'method_not_allowed', message: 'Use POST for the OpenADA MCP endpoint.' } })
    return
  }

  const server = createOpenAdaMcpServer()
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  try {
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  } catch (error) {
    console.error('[mcp] request failed', error)
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal MCP server error.' }, id: null })
    }
  } finally {
    await transport.close().catch(() => undefined)
    await server.close().catch(() => undefined)
  }
}
