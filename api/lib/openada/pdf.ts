export const MAX_PDF_BYTES = 10 * 1024 * 1024

export type PdfCheckResult = {
  compliant: boolean
  profile: 'ua1'
  passedChecksCount: number
  failedChecksCount: number
  failures: Array<{
    ruleId: string
    clause: string
    description: string
    specification: string
    location: string
    context: string
  }>
  raw: unknown
}

export function decodePdf(file: unknown): Buffer {
  if (typeof file !== 'string' || !file.trim()) {
    throw new Error('The file field must contain a base64-encoded PDF.')
  }
  const normalized = file.trim()
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 !== 0) {
    throw new Error('The file field is not valid base64.')
  }
  const decoded = Buffer.from(normalized, 'base64')
  if (decoded.length > MAX_PDF_BYTES) {
    throw new Error('The decoded PDF exceeds the 10 MB limit.')
  }
  if (decoded.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('The decoded file is not a PDF.')
  }
  return decoded
}

export async function checkPdf(input: {
  file: string
  filename: string
  private: boolean
}): Promise<PdfCheckResult> {
  const upstream = String(process.env.VERAPDF_UPSTREAM_URL || '').trim()
  if (!upstream) {
    throw new Error('PDF checking is unavailable: VERAPDF_UPSTREAM_URL is not configured.')
  }

  const response = await fetch(`${upstream.replace(/\/+$/, '')}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(35_000),
  })
  const body = await response.text()
  let result: unknown
  try {
    result = body ? JSON.parse(body) : {}
  } catch {
    throw new Error(`veraPDF returned HTTP ${response.status} with an invalid response.`)
  }
  if (!response.ok) {
    const message = (result as { error?: { message?: unknown } })?.error?.message
    throw new Error(typeof message === 'string' ? message : `veraPDF returned HTTP ${response.status}.`)
  }
  if (typeof (result as PdfCheckResult)?.compliant !== 'boolean') {
    throw new Error('veraPDF returned an invalid response.')
  }
  return result as PdfCheckResult
}
