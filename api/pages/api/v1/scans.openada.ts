import type { NextApiRequest, NextApiResponse } from 'next'
import { applyCors, enforceApiKey, enforceScanHost, handleOptions, publicScansEnabled, readStringParam, requirePost } from '@lib/openada/http'
import { checkAda, htmlToText } from '@lib/openada/ada'
import { checkLanguage } from '@lib/openada/language'
import { extractDocumentTitle, extractSameHostLinks, fetchRemoteHtml } from '@lib/openada/remote'
import { recordScan } from '@lib/openada/directory'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '32kb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)

  if (!requirePost(req, res)) return
  if (!enforceApiKey(req, res)) return
  if (!publicScansEnabled()) {
    res.status(404).json({ error: { code: 'scans_disabled', message: 'Public site scans are disabled.' } })
    return
  }

  const url = readStringParam(req.body?.url).trim()
  const title = readStringParam(req.body?.title).slice(0, 240)
  const language = readStringParam(req.body?.language, 'en-US')
  const crawl = req.body?.crawl === true || readStringParam(req.body?.crawl).toLowerCase() === 'true'
  const requestedMaxPages = Number(req.body?.maxPages)
  const maxPages = crawl
    ? Math.min(Math.max(Number.isFinite(requestedMaxPages) ? Math.floor(requestedMaxPages) : 5, 1), 10)
    : 1
  const wcagTags = Array.isArray(req.body?.wcagTags)
    ? req.body.wcagTags
    : readStringParam(req.body?.wcagTags)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

  if (!url) {
    res.status(400).json({ error: { code: 'missing_url', message: 'The url field is required.' } })
    return
  }

  if (!enforceScanHost(url, res)) return

  try {
    const pending = [url]
    const visited = new Set<string>()
    const pages: Array<{
      sourceUrl: string
      title: string
      ada: Awaited<ReturnType<typeof checkAda>>
      language: { errors: number; issues: Array<Record<string, unknown>> }
      directory: Awaited<ReturnType<typeof recordScan>>
    }> = []
    const errors: Array<{ url: string; message: string }> = []
    let crawlHostname = ''

    while (pending.length > 0 && pages.length < maxPages) {
      const nextUrl = pending.shift() as string
      if (visited.has(nextUrl)) continue
      visited.add(nextUrl)

      try {
        const fetched = await fetchRemoteHtml(nextUrl)
        if (!enforceScanHost(fetched.url, res)) return
        const fetchedHostname = new URL(fetched.url).hostname
        if (!crawlHostname) crawlHostname = fetchedHostname
        if (fetchedHostname !== crawlHostname) continue

        const sourceHtml = fetched.html.slice(0, 200000)
        const text = htmlToText(sourceHtml)
        const [ada, languageResult] = await Promise.all([
          checkAda({ html: sourceHtml, url: fetched.url, wcagTags }),
          checkLanguage(text.slice(0, 20000), language),
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
        const pageTitle = title || extractDocumentTitle(sourceHtml) || fetchedHostname
        const saved = await recordScan({
          url: fetched.url,
          sourceUrl: fetched.url,
          title: pageTitle,
          ada,
          languageErrors: languageIssues.length,
        })

        pages.push({
          sourceUrl: fetched.url,
          title: pageTitle,
          ada,
          language: { errors: languageIssues.length, issues: languageIssues },
          directory: saved,
        })

        if (crawl) {
          for (const link of extractSameHostLinks(sourceHtml, fetched.url)) {
            if (!visited.has(link) && !pending.includes(link) && new URL(link).hostname === crawlHostname) {
              pending.push(link)
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The page scan failed.'
        if (pages.length === 0) throw error
        errors.push({ url: nextUrl, message })
      }
    }

    const first = pages[0]
    res.status(201).json({
      sourceUrl: first?.sourceUrl || url,
      ada: first?.ada || null,
      grade: first?.ada.grade || null,
      language: first?.language || { errors: 0, issues: [] },
      directory: first?.directory || null,
      crawl: {
        enabled: crawl,
        maxPages,
        pagesScanned: pages.length,
        queuedPages: pending.length,
        errors,
      },
      pages: pages.map((page) => ({
        sourceUrl: page.sourceUrl,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The public scan failed.'
    const status = message.includes('storage is not configured') ? 503 : 500
    res.status(status).json({ error: { code: 'scan_failed', message } })
  }
}
