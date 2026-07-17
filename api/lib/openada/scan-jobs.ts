import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import { hostnamesMatch } from '@lib/openada/host'

// Durable scan state lives in DynamoDB so the UI can reconnect after a task restart.
export type ScanJobStatus = 'pending' | 'running' | 'completed' | 'failed'

export type ScanJob = {
  id: string
  siteId?: string
  status: ScanJobStatus
  url: string
  maxPages: number
  pagesScanned: number
  pagesDiscovered: number
  queuedPages: number
  currentUrl: string | null
  pages: Array<Record<string, unknown>>
  errors: Array<{ url: string; message: string }>
  result?: Record<string, unknown>
  errorMessage?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
})

function table(): string {
  const value = String(process.env.OPENADA_SCAN_JOBS_TABLE || '').trim()
  if (!value) throw new Error('OpenADA scan job storage is not configured.')
  return value
}

function now(): string {
  return new Date().toISOString()
}

export async function createScanJob(input: Pick<ScanJob, 'url' | 'maxPages'>): Promise<ScanJob> {
  const timestamp = now()
  const canonicalUrl = new URL(input.url).toString()
  const siteId = new URL(canonicalUrl).hostname.toLowerCase()
  const job: ScanJob = {
    id: randomUUID(),
    siteId,
    status: 'pending',
    url: canonicalUrl,
    maxPages: input.maxPages,
    pagesScanned: 0,
    pagesDiscovered: 1,
    queuedPages: 1,
    currentUrl: null,
    pages: [],
    errors: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await client.send(new PutCommand({ TableName: table(), Item: job }))
  return job
}

export async function getScanJob(id: string): Promise<ScanJob | null> {
  const result = await client.send(new GetCommand({ TableName: table(), Key: { id } }))
  return (result.Item as ScanJob | undefined) || null
}

export async function updateScanJob(id: string, changes: Partial<ScanJob>): Promise<ScanJob> {
  const current = await getScanJob(id)
  if (!current) throw new Error(`Scan job ${id} was not found.`)

  const job: ScanJob = {
    ...current,
    ...changes,
    id: current.id,
    updatedAt: now(),
  }
  await client.send(new PutCommand({ TableName: table(), Item: job }))
  return job
}

export async function listScanJobs(url: string): Promise<ScanJob[]> {
  const result = await client.send(new ScanCommand({
    TableName: table(),
    FilterExpression: '#url = :url',
    ExpressionAttributeNames: { '#url': 'url' },
    ExpressionAttributeValues: { ':url': url },
    Limit: 100,
  }))

  return ((result.Items || []) as ScanJob[]).sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function listScanJobsForHost(hostname: string): Promise<ScanJob[]> {
  const result = await client.send(new ScanCommand({ TableName: table(), Limit: 100 }))
  return ((result.Items || []) as ScanJob[])
    .filter((job) => {
      if (job.siteId) return hostnamesMatch(job.siteId, hostname)
      try {
        return hostnamesMatch(new URL(job.url).hostname, hostname)
      } catch {
        return false
      }
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}
