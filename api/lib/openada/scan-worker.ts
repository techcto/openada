import type { Job } from 'bullmq'
import { recordSiteScanSummary } from '@lib/openada/directory'
import { getScanJob, updateScanJob } from '@lib/openada/scan-jobs'
import type { ScanQueueData } from '@lib/openada/scan-queue'
import { runSiteScan } from '@lib/openada/site-scan'

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, nested) => {
    if (nested instanceof Error) return { message: nested.message, name: nested.name }
    return nested
  })) as T
}

function publicResult(result: Awaited<ReturnType<typeof runSiteScan>>): Record<string, unknown> {
  return jsonSafe({
    sourceUrl: result.sourceUrl,
    ada: result.ada
      ? {
          score: result.ada.score,
          grade: result.ada.grade,
          violationsCount: result.ada.violationsCount,
          passesCount: result.ada.passesCount,
          incompleteCount: result.ada.incompleteCount,
          violations: result.ada.violations,
        }
      : null,
    grade: result.grade,
    language: result.language,
    directory: result.directory,
    crawl: result.crawl,
    pages: result.pages.map((page) => ({
      sourceUrl: page.sourceUrl,
      scanId: page.directory.scan.id,
      title: page.title,
      ada: {
        score: page.ada.score,
        grade: page.ada.grade,
        violationsCount: page.ada.violationsCount,
        passesCount: page.ada.passesCount,
        incompleteCount: page.ada.incompleteCount,
      },
      language: { errors: page.language.errors },
      directory: page.directory,
    })),
  })
}

export async function processScanJob(job: Job<ScanQueueData>): Promise<void> {
  const jobId = job.data.jobId
  const stored = await getScanJob(jobId)
  if (!stored) throw new Error(`Scan job ${jobId} was not found.`)

  await updateScanJob(jobId, { status: 'running', currentUrl: stored.url })
  try {
    const result = await runSiteScan({
      url: job.data.url,
      scanJobId: jobId,
      title: job.data.title,
      language: job.data.language,
      wcagTags: job.data.wcagTags,
      maxPages: job.data.maxPages,
      crawl: true,
      onProgress: async (progress) => {
        await job.updateProgress(progress.pagesScanned)
        await updateScanJob(jobId, {
          status: 'running',
          pagesScanned: progress.pagesScanned,
          pagesDiscovered: progress.pagesDiscovered,
          queuedPages: progress.queuedPages,
          currentUrl: progress.currentUrl,
          errors: progress.errors,
        })
      },
    })

    const safeResult = publicResult(result)
    const completedAt = new Date().toISOString()
    await recordSiteScanSummary({
      hostname: new URL(result.sourceUrl).hostname,
      scannedAt: completedAt,
      ada: result.ada
        ? { score: result.ada.score, grade: result.ada.grade, violationsCount: result.ada.violationsCount }
        : null,
      languageErrors: result.language.errors,
    })
    await updateScanJob(jobId, {
      status: 'completed',
      pagesScanned: result.crawl.pagesScanned,
      pagesDiscovered: result.crawl.pagesScanned + result.crawl.queuedPages,
      queuedPages: result.crawl.queuedPages,
      currentUrl: null,
      errors: result.crawl.errors,
      pages: safeResult.pages as Array<Record<string, unknown>>,
      result: safeResult,
      completedAt,
    })
  } catch (error) {
    await updateScanJob(jobId, {
      status: 'failed',
      currentUrl: null,
      errorMessage: error instanceof Error ? error.message : 'The site scan failed.',
    })
    throw error
  }
}
