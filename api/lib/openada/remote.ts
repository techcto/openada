import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { JSDOM } from 'jsdom'

const MAX_HTML_BYTES = 10 * 1024 * 1024
const MAX_REDIRECTS = 3
const REQUEST_TIMEOUT_MS = 15_000

export type RemoteHtmlResult = {
  html: string
  url: string
}

export async function fetchRemoteHtml(input: string): Promise<RemoteHtmlResult> {
  return fetchRemoteHtmlAtUrl(input, 0)
}

export function extractDocumentTitle(html: string): string {
  const dom = new JSDOM(html)
  try {
    return dom.window.document.querySelector('title')?.textContent?.trim().slice(0, 240) || ''
  } finally {
    dom.window.close()
  }
}

export function extractSameHostLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl)
  const dom = new JSDOM(html, { url: baseUrl })
  try {
    const links = Array.from(dom.window.document.querySelectorAll('a[href]'))
      .map((anchor) => anchor.getAttribute('href') || '')
      .map((href) => {
        try {
          const url = new URL(href, base)
          if (!['http:', 'https:'].includes(url.protocol) || url.hostname !== base.hostname) return ''
          url.hash = ''
          return url.toString()
        } catch {
          return ''
        }
      })
      .filter(Boolean)

    return Array.from(new Set(links))
  } finally {
    dom.window.close()
  }
}

async function fetchRemoteHtmlAtUrl(input: string, redirectCount: number): Promise<RemoteHtmlResult> {
  const url = await validatePublicUrl(input)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'OpenADA URL checker/0.1',
      },
    })

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirectCount >= MAX_REDIRECTS) {
        throw new Error('The page redirected too many times.')
      }

      const location = response.headers.get('location')
      if (!location) throw new Error('The page returned an invalid redirect.')
      const redirectUrl = new URL(location, url)
      // Some geo-routing CDNs emit a locale wildcard such as /us-* to HTTP clients.
      // Resolve it to the neutral English locale instead of following a literal 404 path.
      if (redirectUrl.pathname.includes('*')) {
        redirectUrl.pathname = redirectUrl.pathname.replace(/\*/g, 'en')
      }
      return fetchRemoteHtmlAtUrl(redirectUrl.toString(), redirectCount + 1)
    }

    if (!response.ok) {
      throw new Error(`The page returned HTTP ${response.status}.`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      throw new Error('The URL does not return an HTML document.')
    }

    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > MAX_HTML_BYTES) {
      throw new Error('The page is larger than the 10 MB URL check limit.')
    }

    const html = await readResponseBody(response)
    return { html, url }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The page did not respond within 15 seconds.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function validatePublicUrl(input: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(input)
  } catch {
    throw new Error('Enter a valid public http:// or https:// URL.')
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('Only public http:// and https:// URLs are supported.')
  }

  if (parsed.port && !['80', '443'].includes(parsed.port)) {
    throw new Error('Only standard HTTP and HTTPS ports are supported.')
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new Error('Private and local network URLs are not supported.')
  }

  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true })

  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Private and local network URLs are not supported.')
  }

  return parsed.toString()
}

async function readResponseBody(response: Response): Promise<string> {
  if (!response.body) throw new Error('The page returned an empty response.')

  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = Buffer.from(value)
    totalBytes += chunk.length
    if (totalBytes > MAX_HTML_BYTES) {
      await reader.cancel()
      throw new Error('The page is larger than the 10 MB URL check limit.')
    }
    chunks.push(chunk)
  }

  return new TextDecoder().decode(Buffer.concat(chunks))
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase()
  const version = isIP(normalized)

  if (version === 4) {
    const octets = normalized.split('.').map(Number)
    const [first, second] = octets
    return first === 0
      || first === 10
      || first === 127
      || (first === 100 && second >= 64 && second <= 127)
      || (first === 169 && second === 254)
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 0)
      || (first === 192 && second === 168)
      || (first === 198 && (second === 18 || second === 19 || second === 51))
      || (first === 203 && second === 0 && octets[2] === 113)
      || first >= 224
  }

  if (version === 6) {
    return normalized === '::'
      || normalized === '::1'
      || normalized.startsWith('fc')
      || normalized.startsWith('fd')
      || normalized.startsWith('fe8')
      || normalized.startsWith('fe9')
      || normalized.startsWith('fea')
      || normalized.startsWith('feb')
      || normalized.startsWith('::ffff:192.0.0.')
      || normalized.startsWith('::ffff:10.')
      || normalized.startsWith('::ffff:127.')
      || normalized.startsWith('::ffff:169.254.')
      || normalized.startsWith('::ffff:172.16.')
      || normalized.startsWith('::ffff:192.168.')
  }

  return true
}
