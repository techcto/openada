import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'

export type ScanInput = {
  url: string
  sourceUrl: string
  title?: string
  scanJobId?: string
  ada: {
    score: number
    grade: string
    violationsCount: number
    passesCount: number
    incompleteCount: number
  } | null
  languageErrors: number
  details?: {
    ada: {
      score: number
      grade: string
      violationsCount: number
      passesCount: number
      incompleteCount: number
      violations: unknown[]
    } | null
    language: { errors: number; issues: Array<Record<string, unknown>> }
  }
}

export type SiteRecord = {
  id: string
  hostname: string
  displayName: string
  firstSeenAt: string
  lastScanAt: string
  scanCount: number
  pageCount: number
  latestScore: number | null
  latestGrade: string | null
  latestViolations: number
  latestLanguageErrors: number
}

export type PageRecord = {
  id: string
  siteId: string
  url: string
  path: string
  title: string
  firstSeenAt: string
  lastScanAt: string
  scanCount: number
  latestScanId: string
  latestScore: number | null
  latestGrade: string | null
}

export type ScanRecord = ScanInput & {
  id: string
  siteId: string
  pageId: string
  scannedAt: string
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
})

function table(name: string): string {
  const value = String(process.env[name] || '').trim()
  if (!value) throw new Error(`OpenADA directory storage is not configured (${name}).`)
  return value
}

export async function recordScan(input: ScanInput): Promise<{ site: SiteRecord; page: PageRecord; scan: ScanRecord }> {
  const parsed = new URL(input.url)
  const now = new Date().toISOString()
  const siteId = parsed.hostname.toLowerCase()
  const path = `${parsed.pathname || '/'}${parsed.search}`
  const pageId = `${siteId}:${path}`
  const scanId = randomUUID()
  const score = input.ada?.score ?? null
  const grade = input.ada?.grade ?? null
  const violations = input.ada?.violationsCount ?? 0
  const existingPage = await client.send(new GetCommand({ TableName: table('OPENADA_PAGES_TABLE'), Key: { id: pageId } }))
  const pageIncrement = existingPage.Item ? 0 : 1
  const site: SiteRecord = {
    id: siteId,
    hostname: siteId,
    displayName: input.title?.trim() || siteId,
    firstSeenAt: now,
    lastScanAt: now,
    scanCount: 1,
    pageCount: 1,
    latestScore: score,
    latestGrade: grade,
    latestViolations: violations,
    latestLanguageErrors: input.languageErrors,
  }
  const page: PageRecord = {
    id: pageId,
    siteId,
    url: input.url,
    path,
    title: input.title?.trim() || path,
    firstSeenAt: now,
    lastScanAt: now,
    scanCount: 1,
    latestScanId: scanId,
    latestScore: score,
    latestGrade: grade,
  }
  const details = input.details ? JSON.parse(JSON.stringify(input.details, (_key, value) => {
    if (value instanceof Error) return { name: value.name, message: value.message }
    return value
  })) : undefined

  // Keep the page-level findings needed for the public detail view. Axe can
  // include class instances in results, so normalize before DynamoDB writes.
  const scan: ScanRecord = {
    url: input.url,
    sourceUrl: input.sourceUrl,
    title: input.title,
    scanJobId: input.scanJobId,
    languageErrors: input.languageErrors,
    ada: input.ada
      ? {
          score: input.ada.score,
          grade: input.ada.grade,
          violationsCount: input.ada.violationsCount,
          passesCount: input.ada.passesCount,
          incompleteCount: input.ada.incompleteCount,
        }
      : null,
    details,
    id: scanId,
    siteId,
    pageId,
    scannedAt: now,
  }

  await Promise.all([
    client.send(new UpdateCommand({
      TableName: table('OPENADA_SITES_TABLE'),
      Key: { id: siteId },
      UpdateExpression: 'SET #hostname = :hostname, #displayName = if_not_exists(#displayName, :displayName), #firstSeenAt = if_not_exists(#firstSeenAt, :now), #lastScanAt = :now, #latestScore = :score, #latestGrade = :grade, #latestViolations = :violations, #latestLanguageErrors = :languageErrors, #pageCount = if_not_exists(#pageCount, :zero) + :pageIncrement ADD #scanCount :one',
      ExpressionAttributeNames: {
        '#hostname': 'hostname',
        '#displayName': 'displayName',
        '#firstSeenAt': 'firstSeenAt',
        '#lastScanAt': 'lastScanAt',
        '#latestScore': 'latestScore',
        '#latestGrade': 'latestGrade',
        '#latestViolations': 'latestViolations',
        '#latestLanguageErrors': 'latestLanguageErrors',
        '#pageCount': 'pageCount',
        '#scanCount': 'scanCount',
      },
      ExpressionAttributeValues: {
        ':hostname': siteId,
        ':displayName': site.displayName,
        ':now': now,
        ':score': score,
        ':grade': grade,
        ':violations': violations,
        ':languageErrors': input.languageErrors,
        ':one': 1,
        ':zero': 0,
        ':pageIncrement': pageIncrement,
      },
    })),
    client.send(new UpdateCommand({
      TableName: table('OPENADA_PAGES_TABLE'),
      Key: { id: pageId },
      UpdateExpression: 'SET #siteId = :siteId, #url = :url, #path = :path, #title = if_not_exists(#title, :title), #firstSeenAt = if_not_exists(#firstSeenAt, :now), #lastScanAt = :now, #latestScanId = :scanId, #latestScore = :score, #latestGrade = :grade ADD #scanCount :one',
      ExpressionAttributeNames: {
        '#siteId': 'siteId',
        '#url': 'url',
        '#path': 'path',
        '#title': 'title',
        '#firstSeenAt': 'firstSeenAt',
        '#lastScanAt': 'lastScanAt',
        '#latestScanId': 'latestScanId',
        '#latestScore': 'latestScore',
        '#latestGrade': 'latestGrade',
        '#scanCount': 'scanCount',
      },
      ExpressionAttributeValues: {
        ':siteId': siteId,
        ':url': input.url,
        ':path': path,
        ':title': page.title,
        ':now': now,
        ':scanId': scanId,
        ':score': score,
        ':grade': grade,
        ':one': 1,
      },
    })),
    client.send(new PutCommand({ TableName: table('OPENADA_SCANS_TABLE'), Item: scan })),
  ])

  const existingSite = await client.send(new GetCommand({ TableName: table('OPENADA_SITES_TABLE'), Key: { id: siteId } }))
  const savedPage = await client.send(new GetCommand({ TableName: table('OPENADA_PAGES_TABLE'), Key: { id: pageId } }))
  return {
    site: { ...site, ...(existingSite.Item as Partial<SiteRecord>), lastScanAt: now, latestScore: score, latestGrade: grade, latestViolations: violations, latestLanguageErrors: input.languageErrors, scanCount: Number(existingSite.Item?.scanCount || 1), pageCount: Number(existingSite.Item?.pageCount || 1) },
    page: { ...page, ...(savedPage.Item as Partial<PageRecord>), lastScanAt: now, latestScanId: scanId, latestScore: score, latestGrade: grade, scanCount: Number(savedPage.Item?.scanCount || 1) },
    scan,
  }
}

export async function listSites(): Promise<SiteRecord[]> {
  const result = await client.send(new ScanCommand({ TableName: table('OPENADA_SITES_TABLE'), Limit: 100 }))
  return ((result.Items || []) as SiteRecord[]).sort((left, right) => right.lastScanAt.localeCompare(left.lastScanAt))
}

export async function getSite(siteId: string): Promise<{ site: SiteRecord | null; pages: PageRecord[]; scans: ScanRecord[] }> {
  const [siteResult, pageResult, scanResult] = await Promise.all([
    client.send(new GetCommand({ TableName: table('OPENADA_SITES_TABLE'), Key: { id: siteId } })),
    client.send(new ScanCommand({ TableName: table('OPENADA_PAGES_TABLE'), FilterExpression: '#siteId = :siteId', ExpressionAttributeNames: { '#siteId': 'siteId' }, ExpressionAttributeValues: { ':siteId': siteId }, Limit: 100 })),
    client.send(new ScanCommand({ TableName: table('OPENADA_SCANS_TABLE'), FilterExpression: '#siteId = :siteId', ExpressionAttributeNames: { '#siteId': 'siteId' }, ExpressionAttributeValues: { ':siteId': siteId }, Limit: 100 })),
  ])
  const pages = ((pageResult.Items || []) as PageRecord[]).sort((left, right) => right.lastScanAt.localeCompare(left.lastScanAt))
  const scans = ((scanResult.Items || []) as ScanRecord[]).sort((left, right) => right.scannedAt.localeCompare(left.scannedAt))
  return { site: (siteResult.Item as SiteRecord | undefined) || null, pages, scans }
}

export async function getScan(scanId: string): Promise<ScanRecord | null> {
  const result = await client.send(new GetCommand({ TableName: table('OPENADA_SCANS_TABLE'), Key: { id: scanId } }))
  return (result.Item as ScanRecord | undefined) || null
}
