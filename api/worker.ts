import { Worker } from 'bullmq'
import { getRedisConnection } from '@lib/openada/scan-queue'
import type { ScanQueueData } from '@lib/openada/scan-queue'
import { processScanJob } from '@lib/openada/scan-worker'

const connection = getRedisConnection()
const worker = new Worker<ScanQueueData>('openada-scans', processScanJob, {
  connection,
  concurrency: Math.max(1, Number(process.env.OPENADA_SCAN_WORKER_CONCURRENCY || 1)),
})

worker.on('completed', (job) => console.log(`[worker] scan job ${job.id} completed`))
worker.on('failed', (job, error) => console.error(`[worker] scan job ${job?.id} failed:`, error.message))
worker.on('error', (error) => console.error('[worker] scan worker error:', error))

console.log('[worker] started - listening for OpenADA scan jobs')

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received, shutting down...`)
  await worker.close()
  connection.disconnect()
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
