import type { NextApiRequest, NextApiResponse } from 'next'
import {
  applyCors,
  enforceApiKey,
  handleOptions,
  readStringParam,
  requirePost,
} from '@lib/openada/http'
import { checkAda, htmlToText } from '@lib/openada/ada'
import { checkLanguage } from '@lib/openada/language'
import { fetchRemoteHtml } from '@lib/openada/remote'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)

  if (!requirePost(req, res)) return
  if (!enforceApiKey(req, res)) return

  const html = readStringParam(req.body?.html).slice(0, 200000)
  const text = readStringParam(req.body?.text)
  const language = readStringParam(req.body?.language, 'en-US')
  const url = readStringParam(req.body?.url).trim()
  const wcagTags = Array.isArray(req.body?.wcagTags)
    ? req.body.wcagTags
    : readStringParam(req.body?.wcagTags)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

  if (!html.trim() && !text.trim() && !url) {
    res.status(400).json({
      error: {
        code: 'missing_content',
        message: 'Provide html, text, or a public URL.',
      },
    })
    return
  }

  try {
    const fetched = !html.trim() && url ? await fetchRemoteHtml(url) : null
    const sourceHtml = (fetched?.html || html).slice(0, 200000)
    const sourceUrl = fetched?.url || url || 'https://openada.local/'
    const languageText = (text.trim() || htmlToText(sourceHtml)).slice(0, 20000)
    const [ada, languageResult] = await Promise.all([
      sourceHtml.trim() ? checkAda({ html: sourceHtml, url: sourceUrl, wcagTags }) : Promise.resolve(null),
      checkLanguage(languageText, language),
    ])

    res.status(200).json({
      sourceUrl: fetched?.url || undefined,
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
        raw: languageResult,
      },
    })
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'check_failed',
        message: error instanceof Error ? error.message : 'The OpenADA check failed.',
      },
    })
  }
}
