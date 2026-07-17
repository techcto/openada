import http from 'node:http'
import { Readable } from 'node:stream'

const HOST = '0.0.0.0'
const PORT = Number.parseInt(process.env.PORT || '8000', 10) || 8000
const MAX_BODY_BYTES = 1024 * 1024
const upstreamUrl = String(process.env.OPENADA_MCP_URL || '').trim().replace(/\/+$/, '')
const upstreamApiKey = String(process.env.OPENADA_API_KEY || '').trim()

if (!upstreamUrl) {
  throw new Error('OPENADA_MCP_URL is required.')
}

try {
  const parsed = new URL(upstreamUrl)
  if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new Error('OPENADA_MCP_URL must use HTTPS in production.')
  }
} catch (error) {
  throw new Error(`Invalid OPENADA_MCP_URL: ${error.message}`)
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function methodNotAllowed(res) {
  sendJson(res, 405, {
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed.' },
    id: null,
  })
}

async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      throw new Error('MCP request body exceeds the 1 MB limit.')
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function proxyMcp(req, res) {
  const body = await readBody(req)
  const headers = {
    accept: req.headers.accept || 'application/json, text/event-stream',
    'content-type': req.headers['content-type'] || 'application/json',
  }

  if (req.headers['mcp-protocol-version']) {
    headers['mcp-protocol-version'] = req.headers['mcp-protocol-version']
  }
  if (upstreamApiKey) {
    headers.authorization = `Bearer ${upstreamApiKey}`
  }

  const upstream = await fetch(upstreamUrl, {
    method: 'POST',
    headers,
    body,
  })

  const responseHeaders = {}
  for (const name of ['content-type', 'cache-control', 'mcp-session-id', 'mcp-protocol-version']) {
    const value = upstream.headers.get(name)
    if (value) responseHeaders[name] = value
  }
  res.writeHead(upstream.status, responseHeaders)
  if (!upstream.body) {
    res.end()
    return
  }
  Readable.fromWeb(upstream.body).pipe(res)
}

const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname

    if (path === '/ping' || path === '/health') {
      sendJson(res, 200, { status: 'Healthy' })
      return
    }

    if (path === '/') {
      sendJson(res, 200, {
        name: 'OpenADA MCP AgentCore',
        version: '0.1.0',
        transport: 'stateless streamable HTTP',
        endpoint: '/mcp',
      })
      return
    }

    if (path !== '/mcp') {
      sendJson(res, 404, { error: 'Not found.' })
      return
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'Accept, Content-Type, Mcp-Protocol-Version',
      })
      res.end()
      return
    }

    if (req.method !== 'POST') {
      methodNotAllowed(res)
      return
    }

    await proxyMcp(req, res)
  } catch (error) {
    console.error('[openada-agentcore] request failed:', error.message)
    if (!res.headersSent) {
      sendJson(res, 502, {
        jsonrpc: '2.0',
        error: { code: -32001, message: 'The configured OpenADA MCP endpoint could not be reached.' },
        id: null,
      })
    } else {
      res.destroy()
    }
  }
})

server.listen(PORT, HOST, () => {
  console.log(`[openada-agentcore] listening on ${HOST}:${PORT}`)
})

function shutdown(signal) {
  console.log(`[openada-agentcore] received ${signal}`)
  server.close(() => process.exit(0))
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
