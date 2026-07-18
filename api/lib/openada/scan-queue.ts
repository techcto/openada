import { Queue } from 'bullmq'
import Redis from 'ioredis'

export type ScanQueueData = {
  jobId: string
  url: string
  title?: string
  language: string
  wcagTags: string[]
  maxPages: number
  isPrivate?: boolean
}

function redisConnection() {
  const host = String(process.env.OPENADA_REDIS_HOST || process.env.REDIS_HOST || '').trim()
  if (!host) throw new Error('OpenADA scan queue is not configured (OPENADA_REDIS_HOST).')

  return new Redis({
    host,
    port: Number(process.env.OPENADA_REDIS_PORT || process.env.REDIS_PORT || 6379),
    password: process.env.OPENADA_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
    tls: String(process.env.OPENADA_REDIS_TLS || process.env.REDIS_TLS || '').toLowerCase() === 'true'
      ? { checkServerIdentity: () => undefined }
      : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
}

let queue: Queue<ScanQueueData> | null = null

export function getScanQueue(): Queue<ScanQueueData> {
  if (!queue) queue = new Queue<ScanQueueData>('openada-scans', { connection: redisConnection() })
  return queue
}

export function getRedisConnection() {
  return redisConnection()
}
