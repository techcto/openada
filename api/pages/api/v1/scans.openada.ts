import type { NextApiRequest, NextApiResponse } from 'next'
import {
  applyCors,
  enforceApiKey,
  enforceScanHost,
  handleOptions,
  publicScansEnabled,
  readStringParam,
  readBooleanParam,
  requirePost,
} from '@lib/openada/http'
import { listScanJobs } from '@lib/openada/scan-jobs'
import { runSiteScan } from '@lib/openada/site-scan'
import { startQueuedScan } from '@lib/openada/scan-service'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '32kb',
    },
  },
}

function scanOptions(body: NextApiRequest['body']) {
  const url = readStringParam(body?.url).trim()
  const title = readStringParam(body?.title).slice(0, 240)
  const language = readStringParam(body?.language, 'en-US')
  const requestedMaxPages = Number(body?.maxPages)
  const maxPages = Math.min(
    Math.max(Number.isFinite(requestedMaxPages) ? Math.floor(requestedMaxPages) : 50, 1),
    100,
  )
  const wcagTags = Array.isArray(body?.wcagTags)
    ? body.wcagTags.map(String)
    : readStringParam(body?.wcagTags)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

  return { url, title, language, maxPages, wcagTags, isPrivate: readBooleanParam(body?.private, false) }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)

  if (!enforceApiKey(req, res)) return
  if (!publicScansEnabled()) {
    res.status(404).json({ error: { code: 'scans_disabled', message: 'Public site scans are disabled.' } })
    return
  }

  if (req.method === 'GET') {
    const url = readStringParam(req.query.url).trim()
    if (!url) {
      res.status(400).json({ error: { code: 'missing_url', message: 'The url query parameter is required.' } })
      return
    }
    if (!enforceScanHost(url, res)) return
    try {
      const jobs = await listScanJobs(url)
      res.status(200).json({
        scans: jobs.map((job) => {
          const result = job.result as { ada?: { score?: number; grade?: string }; pages?: unknown[] } | undefined
          return {
            jobId: job.id,
            status: job.status,
            url: job.url,
            pagesScanned: job.pagesScanned,
            maxPages: job.maxPages,
            score: result?.ada?.score ?? null,
            grade: result?.ada?.grade ?? null,
            createdAt: job.createdAt,
            completedAt: job.completedAt || null,
          }
        }),
      })
    } catch (error) {
      res.status(500).json({ error: { code: 'scan_history_failed', message: error instanceof Error ? error.message : 'Unable to load scan history.' } })
    }
    return
  }

  if (!requirePost(req, res)) return

  const options = scanOptions(req.body)
  const crawl = req.body?.crawl === true || readStringParam(req.body?.crawl).toLowerCase() === 'true'

  if (!options.url) {
    res.status(400).json({ error: { code: 'missing_url', message: 'The url field is required.' } })
    return
  }
  if (!enforceScanHost(options.url, res)) return

  try {
    if (crawl) {
      const job = await startQueuedScan(options)

      res.status(202).json({
        jobId: job.id,
        status: job.status,
        url: job.url,
        maxPages: job.maxPages,
        visibility: options.isPrivate ? 'private' : 'public',
        statusUrl: `/api/v1/scans/${job.id}`,
      })
      return
    }

    const result = await runSiteScan({ ...options, crawl: false, maxPages: 1, publishToDirectory: !options.isPrivate })
    res.status(201).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The public scan failed.'
    const status = message.includes('storage is not configured') ? 503 : 500
    res.status(status).json({ error: { code: 'scan_failed', message } })
  }
}
