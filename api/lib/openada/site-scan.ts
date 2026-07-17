import { checkAda, htmlToText } from '@lib/openada/ada'
import { checkLanguage } from '@lib/openada/language'
import { extractDocumentTitle, extractSameHostLinks, fetchRemoteHtml } from '@lib/openada/remote'
import { recordScan } from '@lib/openada/directory'

export type SiteScanPage = {
  sourceUrl: string
  title: string
  ada: Awaited<ReturnType<typeof checkAda>>
  language: { errors: number; issues: Array<Record<string, unknown>> }
  directory: Awaited<ReturnType<typeof recordScan>>
}

export type SiteScanResult = {
  sourceUrl: string
  ada: SiteScanPage['ada'] | null
  grade: string | null
  language: SiteScanPage['language']
  directory: SiteScanPage['directory'] | null
  crawl: {
    enabled: boolean
    maxPages: number
    pagesScanned: number
    queuedPages: number
    errors: Array<{ url: string; message: string }>
  }
  pages: SiteScanPage[]
}

export type SiteScanProgress = {
  pagesScanned: number
  pagesDiscovered: number
  queuedPages: number
  currentUrl: string | null
  errors: Array<{ url: string; message: string }>
}

type SiteScanInput = {
  url: string
  scanJobId?: string
  title?: string
  language: string
  wcagTags: string[]
  maxPages: number
  crawl: boolean
  onProgress?: (progress: SiteScanProgress) => Promise<void> | void
}

export async function runSiteScan(input: SiteScanInput): Promise<SiteScanResult> {
  const pending = [new URL(input.url).toString()]
  const visited = new Set<string>()
  const pages: SiteScanPage[] = []
  const errors: Array<{ url: string; message: string }> = []
  let crawlHostname = ''

  const reportProgress = async (currentUrl: string | null) => {
    await input.onProgress?.({
      pagesScanned: pages.length,
      pagesDiscovered: pages.length + pending.length,
      queuedPages: pending.length,
      currentUrl,
      errors: [...errors],
    })
  }

  await reportProgress(null)

  while (pending.length > 0 && pages.length < input.maxPages) {
    const nextUrl = pending.shift() as string
    if (visited.has(nextUrl)) continue
    visited.add(nextUrl)

    try {
      await reportProgress(nextUrl)
      const fetched = await fetchRemoteHtml(nextUrl)
      const fetchedHostname = new URL(fetched.url).hostname
      if (!crawlHostname) crawlHostname = fetchedHostname
      if (fetchedHostname !== crawlHostname) continue

      const sourceHtml = fetched.html.slice(0, 200000)
      const text = htmlToText(sourceHtml)
      const [ada, languageResult] = await Promise.all([
        checkAda({ html: sourceHtml, url: fetched.url, wcagTags: input.wcagTags }),
        checkLanguage(text.slice(0, 20000), input.language),
      ])
      const languageIssues = languageResult.matches.map((match) => ({
        type: match.rule.issueType,
        word: text.slice(match.offset, match.offset + match.length),
        message: match.message,
        fix: match.replacements[0]?.value || null,
        offset: match.offset,
        length: match.length,
        ruleId: match.rule.id,
      }))
      const pageTitle = input.title || extractDocumentTitle(sourceHtml) || fetchedHostname
      const saved = await recordScan({
        url: fetched.url,
        sourceUrl: fetched.url,
        title: pageTitle,
        scanJobId: input.scanJobId,
        ada,
        languageErrors: languageIssues.length,
        details: {
          ada: {
            score: ada.score,
            grade: ada.grade,
            violationsCount: ada.violationsCount,
            passesCount: ada.passesCount,
            incompleteCount: ada.incompleteCount,
            violations: ada.violations,
          },
          language: { errors: languageIssues.length, issues: languageIssues },
        },
      })

      pages.push({
        sourceUrl: fetched.url,
        title: pageTitle,
        ada,
        language: { errors: languageIssues.length, issues: languageIssues },
        directory: saved,
      })

      if (input.crawl) {
        for (const link of extractSameHostLinks(sourceHtml, fetched.url)) {
          if (
            pending.length < 500
            && !visited.has(link)
            && !pending.includes(link)
            && new URL(link).hostname === crawlHostname
          ) {
            pending.push(link)
          }
        }
      }
      await reportProgress(fetched.url)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The page scan failed.'
      if (pages.length === 0) throw error
      errors.push({ url: nextUrl, message })
      await reportProgress(nextUrl)
    }
  }

  const first = pages[0]
  return {
    sourceUrl: first?.sourceUrl || input.url,
    ada: first?.ada || null,
    grade: first?.ada.grade || null,
    language: first?.language || { errors: 0, issues: [] },
    directory: first?.directory || null,
    crawl: {
      enabled: input.crawl,
      maxPages: input.maxPages,
      pagesScanned: pages.length,
      queuedPages: pending.length,
      errors,
    },
    pages,
  }
}
