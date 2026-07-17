import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { checkAda, htmlToText } from '@lib/openada/ada'
import { getScan, getSite, listSites } from '@lib/openada/directory'
import { checkLanguage } from '@lib/openada/language'
import { fetchRemoteHtml } from '@lib/openada/remote'
import { getScanJob, listScanJobsForHost } from '@lib/openada/scan-jobs'
import { startQueuedScan } from '@lib/openada/scan-service'

const MAX_HTML = 200000
const MAX_TEXT = 20000

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, nested) => {
    if (nested instanceof Error) return { name: nested.name, message: nested.message }
    return nested
  })) as T
}

function toolResult(value: unknown) {
  const safe = jsonSafe(value) as Record<string, unknown>
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(safe) }],
    structuredContent: safe,
  }
}

function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : 'The OpenADA operation failed.'
  return {
    isError: true,
    content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }],
  }
}

function normalizePages(value: number | undefined): number {
  return Math.min(Math.max(Number.isFinite(value) ? Math.floor(value as number) : 5, 1), 100)
}

function normalizeTags(value: string | undefined): string[] {
  return (value || '').split(',').map((tag) => tag.trim()).filter(Boolean)
}

function jobSummary(job: Awaited<ReturnType<typeof getScanJob>>) {
  if (!job) return null
  const result = job.result as { ada?: { score?: number; grade?: string }; language?: { errors?: number } } | undefined
  return {
    jobId: job.id,
    status: job.status,
    url: job.url,
    maxPages: job.maxPages,
    pagesScanned: job.pagesScanned,
    pagesDiscovered: job.pagesDiscovered,
    queuedPages: job.queuedPages,
    currentUrl: job.currentUrl,
    score: result?.ada?.score ?? null,
    grade: result?.ada?.grade ?? null,
    languageErrors: result?.language?.errors ?? null,
    errors: job.errors,
    result: job.status === 'completed' ? job.result : undefined,
    error: job.errorMessage || null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt || null,
  }
}

export function createOpenAdaMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'openada',
      version: '0.1.0',
    },
    {
      instructions: 'OpenADA checks public web pages for accessibility and language findings. Use scan tools for asynchronous multi-page crawls. Automated checks are engineering signals, not a legal determination or a substitute for an accessibility review.',
    },
  )

  server.registerTool('openada_check_page', {
    title: 'Check a page',
    description: 'Run OpenADA accessibility and language checks against submitted HTML, text, or a public page URL.',
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
    inputSchema: {
      url: z.string().url().optional().describe('Public page URL to fetch and check.'),
      html: z.string().max(MAX_HTML).optional().describe('HTML to check when a URL is not supplied.'),
      text: z.string().max(MAX_TEXT).optional().describe('Plain text to check for language findings.'),
      language: z.string().default('en-US').describe('LanguageTool language code, such as en-US.'),
      wcagTags: z.string().optional().describe('Comma-separated axe-core tags, such as wcag2a,wcag2aa.'),
    },
  }, async ({ url, html, text, language, wcagTags }) => {
    if (!html?.trim() && !text?.trim() && !url) return toolError('Provide html, text, or a public URL.')
    try {
      const fetched = !html?.trim() && url ? await fetchRemoteHtml(url) : null
      const sourceHtml = (fetched?.html || html || '').slice(0, MAX_HTML)
      const sourceUrl = fetched?.url || url || 'https://openada.local/'
      const languageText = (text?.trim() || htmlToText(sourceHtml)).slice(0, MAX_TEXT)
      const [ada, languageResult] = await Promise.all([
        sourceHtml.trim() ? checkAda({ html: sourceHtml, url: sourceUrl, wcagTags: normalizeTags(wcagTags) }) : Promise.resolve(null),
        checkLanguage(languageText, language),
      ])
      return toolResult({
        sourceUrl: fetched?.url || url || null,
        ada,
        language: {
          errors: languageResult.matches.length,
          issues: languageResult.matches.map((match) => ({
            type: match.rule.issueType,
            word: languageText.slice(match.offset, match.offset + match.length),
            message: match.message,
            fix: match.replacements[0]?.value || null,
            offset: match.offset,
            length: match.length,
            ruleId: match.rule.id,
          })),
        },
      })
    } catch (error) {
      return toolError(error)
    }
  })

  server.registerTool('openada_scan_site', {
    title: 'Scan a website',
    description: 'Start an asynchronous same-host crawl of public pages. Poll openada_get_scan_status with the returned jobId for progress and the final report.',
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
    inputSchema: {
      url: z.string().url().describe('Public website URL to crawl.'),
      maxPages: z.number().int().min(1).max(100).default(5).describe('Maximum number of same-host pages to scan.'),
      language: z.string().default('en-US').describe('LanguageTool language code.'),
      wcagTags: z.string().optional().describe('Comma-separated axe-core tags.'),
      title: z.string().max(240).optional().describe('Optional title for the scan pages.'),
    },
  }, async ({ url, maxPages, language, wcagTags, title }) => {
    try {
      const job = await startQueuedScan({
        url,
        maxPages: normalizePages(maxPages),
        language,
        wcagTags: normalizeTags(wcagTags),
        title,
      })
      return toolResult({
        jobId: job.id,
        status: job.status,
        url: job.url,
        maxPages: job.maxPages,
        statusUrl: `/api/v1/scans/${job.id}`,
        message: 'Scan queued. Poll openada_get_scan_status for progress.',
      })
    } catch (error) {
      return toolError(error)
    }
  })

  server.registerTool('openada_get_scan_status', {
    title: 'Get scan status',
    description: 'Read durable progress, errors, and the completed report for an OpenADA site scan job.',
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
    inputSchema: {
      jobId: z.string().min(1).describe('Job ID returned by openada_scan_site.'),
      includePages: z.boolean().default(true).describe('Include page summaries and findings when the scan is complete.'),
    },
  }, async ({ jobId, includePages }) => {
    try {
      const job = await getScanJob(jobId)
      if (!job) return toolError('That scan job was not found.')
      const summary = jobSummary(job)
      if (summary && !includePages && summary.result && typeof summary.result === 'object') {
        delete (summary.result as Record<string, unknown>).pages
      }
      return toolResult(summary)
    } catch (error) {
      return toolError(error)
    }
  })

  server.registerTool('openada_directory', {
    title: 'Browse the public directory',
    description: 'List public sites or inspect one site with its scan history and pages. Use this to compare accessibility scores over time.',
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
    inputSchema: {
      site: z.string().optional().describe('Hostname such as www.example.com. Omit to list sites.'),
      scanId: z.string().optional().describe('Optional scan job ID to inspect.'),
      pageId: z.string().optional().describe('Optional stored page scan ID to inspect findings.'),
    },
  }, async ({ site, scanId, pageId }) => {
    try {
      if (!site?.trim()) return toolResult({ sites: await listSites() })
      const siteId = site.trim().toLowerCase()
      const detail = await getSite(siteId)
      if (!detail.site) return toolError('That site is not in the public directory.')
      const jobs = await listScanJobsForHost(siteId)
      const selectedJob = scanId ? await getScanJob(scanId) : null
      const selectedPage = pageId ? await getScan(pageId) : null
      return toolResult({
        site: detail.site,
        pages: detail.pages,
        scans: detail.scans,
        scanJobs: jobs.map(jobSummary),
        selectedScan: jobSummary(selectedJob),
        selectedPage,
      })
    } catch (error) {
      return toolError(error)
    }
  })

  return server
}
