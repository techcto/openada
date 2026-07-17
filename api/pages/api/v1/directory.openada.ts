import type { NextApiRequest, NextApiResponse } from 'next'
import { applyCors, handleOptions } from '@lib/openada/http'
import { getScan, getSite, listSites } from '@lib/openada/directory'
import { getScanJob, listScanJobsForHost } from '@lib/openada/scan-jobs'

type JobLike = NonNullable<Awaited<ReturnType<typeof getScanJob>>>

function jobBelongsToSite(job: JobLike, siteId: string): boolean {
  if (job.siteId) return job.siteId.toLowerCase() === siteId
  try {
    return new URL(job.url).hostname.toLowerCase() === siteId
  } catch {
    return false
  }
}

function jobSummary(job: JobLike) {
  const result = job.result as { ada?: { score?: number; grade?: string } } | undefined
  return {
    id: job.id,
    jobId: job.id,
    status: job.status,
    url: job.url,
    pagesScanned: job.pagesScanned,
    maxPages: job.maxPages,
    score: result?.ada?.score ?? null,
    grade: result?.ada?.grade ?? null,
    createdAt: job.createdAt,
    completedAt: job.completedAt || null,
    errorMessage: job.errorMessage || null,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)

  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: { code: 'method_not_allowed', message: 'Use GET for the directory.' } })
      return
    }

    const siteId = typeof req.query.site === 'string' ? req.query.site.trim().toLowerCase() : ''
    if (!siteId) {
      res.status(200).json({ sites: await listSites() })
      return
    }

    const result = await getSite(siteId)
    if (!result.site) {
      res.status(404).json({ error: { code: 'site_not_found', message: 'That site is not in the directory.' } })
      return
    }

    const scanId = typeof req.query.scan === 'string' ? req.query.scan.trim() : ''
    const pageId = typeof req.query.page === 'string' ? req.query.page.trim() : ''
    const jobs = await listScanJobsForHost(siteId)
    const selectedJob = scanId ? await getScanJob(scanId) : null

    if (pageId) {
      const pageScan = await getScan(pageId)
      if (!pageScan || pageScan.siteId !== siteId) {
        res.status(404).json({ error: { code: 'page_scan_not_found', message: 'That page scan is not in the directory.' } })
        return
      }
      if (selectedJob && !jobBelongsToSite(selectedJob, siteId)) {
        res.status(404).json({ error: { code: 'scan_not_found', message: 'That scan is not in the directory.' } })
        return
      }
      const jobResult = selectedJob?.result as { directory?: { scan?: { id?: string } }; ada?: Record<string, unknown>; language?: Record<string, unknown> } | undefined
      const isFirstPage = jobResult?.directory?.scan?.id === pageId
      const pageWithLegacyDetails = !pageScan.details && isFirstPage
        ? { ...pageScan, details: { ada: jobResult?.ada || null, language: jobResult?.language || null } }
        : pageScan
      res.status(200).json({
        site: result.site,
        scan: selectedJob
          ? jobSummary(selectedJob)
          : { id: pageScan.scanJobId || pageScan.id, jobId: pageScan.scanJobId || null, status: 'completed', createdAt: pageScan.scannedAt, completedAt: pageScan.scannedAt, pagesScanned: 1, maxPages: 1, score: pageScan.ada?.score ?? null, grade: pageScan.ada?.grade ?? null },
        page: pageWithLegacyDetails,
      })
      return
    }

    if (scanId) {
      if (selectedJob && jobBelongsToSite(selectedJob, siteId)) {
        const jobResult = selectedJob.result as { pages?: Array<Record<string, unknown>>; crawl?: Record<string, unknown>; ada?: Record<string, unknown>; language?: Record<string, unknown> } | undefined
        res.status(200).json({
          site: result.site,
          scan: jobSummary(selectedJob),
          summary: { ada: jobResult?.ada || null, language: jobResult?.language || null, crawl: jobResult?.crawl || null },
          pages: jobResult?.pages || selectedJob.pages || [],
        })
        return
      }

      const legacyScan = result.scans.find((scan) => scan.id === scanId)
      if (!legacyScan) {
        res.status(404).json({ error: { code: 'scan_not_found', message: 'That scan is not in the directory.' } })
        return
      }
      const legacyPage = result.pages.find((page) => page.id === legacyScan.pageId)
      res.status(200).json({
        site: result.site,
        scan: { id: legacyScan.id, jobId: null, status: 'completed', url: legacyScan.url, createdAt: legacyScan.scannedAt, completedAt: legacyScan.scannedAt, pagesScanned: 1, maxPages: 1, score: legacyScan.ada?.score ?? null, grade: legacyScan.ada?.grade ?? null },
        pages: legacyPage ? [{ ...legacyPage, scanId: legacyScan.id }] : [],
      })
      return
    }

    const historicalJobs = jobs.map(jobSummary)
    const legacyScans = result.scans
      .filter((scan) => !scan.scanJobId)
      .map((scan) => ({ id: scan.id, jobId: null, status: 'completed', url: scan.url, pagesScanned: 1, maxPages: 1, score: scan.ada?.score ?? null, grade: scan.ada?.grade ?? null, createdAt: scan.scannedAt, completedAt: scan.scannedAt }))
    res.status(200).json({
      site: result.site,
      scans: [...historicalJobs, ...legacyScans].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    })
  } catch (error) {
    res.status(503).json({
      error: {
        code: 'directory_unavailable',
        message: error instanceof Error ? error.message : 'The public directory is unavailable.',
      },
    })
  }
}
