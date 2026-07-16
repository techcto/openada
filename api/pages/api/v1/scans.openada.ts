import type { NextApiRequest, NextApiResponse } from 'next'
import { applyCors, enforceApiKey, handleOptions, readStringParam, requirePost } from '@lib/openada/http'
import { checkAda, htmlToText } from '@lib/openada/ada'
import { checkLanguage } from '@lib/openada/language'
import { fetchRemoteHtml } from '@lib/openada/remote'
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

  const url = readStringParam(req.body?.url).trim()
  const title = readStringParam(req.body?.title).slice(0, 240)
  const language = readStringParam(req.body?.language, 'en-US')
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

  try {
    const fetched = await fetchRemoteHtml(url)
    const sourceHtml = fetched.html.slice(0, 200000)
    const [ada, languageResult] = await Promise.all([
      checkAda({ html: sourceHtml, url: fetched.url, wcagTags }),
      checkLanguage(htmlToText(sourceHtml).slice(0, 20000), language),
    ])
    const languageIssues = languageResult.matches.map((match) => ({
      type: match.rule.issueType,
      word: htmlToText(sourceHtml).slice(match.offset, match.offset + match.length),
      message: match.message,
      fix: match.replacements[0]?.value || null,
      offset: match.offset,
      length: match.length,
      ruleId: match.rule.id,
    }))
    const saved = await recordScan({
      url: fetched.url,
      sourceUrl: fetched.url,
      title,
      ada,
      languageErrors: languageIssues.length,
    })

    res.status(201).json({
      sourceUrl: fetched.url,
      ada,
      language: { errors: languageIssues.length, issues: languageIssues },
      directory: saved,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The public scan failed.'
    const status = message.includes('storage is not configured') ? 503 : 500
    res.status(status).json({ error: { code: 'scan_failed', message } })
  }
}
