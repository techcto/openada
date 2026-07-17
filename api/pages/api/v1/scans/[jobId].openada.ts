import type { NextApiRequest, NextApiResponse } from 'next'
import { applyCors, enforceApiKey, handleOptions } from '@lib/openada/http'
import { getScanJob } from '@lib/openada/scan-jobs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)
  if (!enforceApiKey(req, res)) return

  if (req.method !== 'GET') {
    res.status(405).json({ error: { code: 'method_not_allowed', message: 'Use GET for scan job status.' } })
    return
  }

  const jobId = typeof req.query.jobId === 'string' ? req.query.jobId : ''
  if (!jobId) {
    res.status(400).json({ error: { code: 'missing_job_id', message: 'A scan job id is required.' } })
    return
  }

  try {
    const job = await getScanJob(jobId)
    if (!job) {
      res.status(404).json({ error: { code: 'scan_not_found', message: 'The scan job was not found.' } })
      return
    }

    res.status(200).json({
      jobId: job.id,
      status: job.status,
      url: job.url,
      maxPages: job.maxPages,
      progress: {
        pagesScanned: job.pagesScanned,
        pagesDiscovered: job.pagesDiscovered,
        queuedPages: job.queuedPages,
        currentUrl: job.currentUrl,
        errors: job.errors,
      },
      result: job.result || null,
      error: job.errorMessage ? { message: job.errorMessage } : null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt || null,
    })
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'scan_status_failed',
        message: error instanceof Error ? error.message : 'Unable to load scan status.',
      },
    })
  }
}
