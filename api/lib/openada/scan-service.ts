import { createScanJob, updateScanJob } from '@lib/openada/scan-jobs'
import { getScanQueue } from '@lib/openada/scan-queue'

export type QueuedScanOptions = {
  url: string
  maxPages: number
  title?: string
  language: string
  wcagTags: string[]
}

export async function startQueuedScan(options: QueuedScanOptions) {
  const job = await createScanJob({ url: options.url, maxPages: options.maxPages })
  try {
    await getScanQueue().add(
      'site-scan',
      { ...options, url: job.url, jobId: job.id },
      { jobId: job.id },
    )
  } catch (queueError) {
    await updateScanJob(job.id, {
      status: 'failed',
      errorMessage: queueError instanceof Error ? queueError.message : 'The scan queue is unavailable.',
    })
    throw new Error('The site scan queue is unavailable. Please try again shortly.')
  }

  return job
}
