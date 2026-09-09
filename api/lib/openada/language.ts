export type LanguageIssueType = 'misspelling' | 'grammar' | 'style'

export type LanguageReplacement = {
  value: string
}

export type LanguageMatch = {
  message: string
  shortMessage: string
  offset: number
  length: number
  replacements: LanguageReplacement[]
  context: {
    text: string
    offset: number
    length: number
  }
  sentence: string
  rule: {
    id: string
    description: string
    issueType: LanguageIssueType
    category: {
      id: string
      name: string
    }
  }
}

export type LanguageCheckResult = {
  software: {
    name: string
    version: string
    apiVersion: number
  }
  warnings: {
    incompleteResults: boolean
  }
  language: {
    name: string
    code: string
  }
  matches: LanguageMatch[]
}

export const supportedLanguages = [
  { name: 'English (US)', code: 'en-US', longCode: 'en-US' },
  { name: 'English', code: 'en', longCode: 'en' },
]

export async function checkLanguage(text: string, language = 'en-US'): Promise<LanguageCheckResult> {
  const upstream = String(process.env.LANGUAGETOOL_UPSTREAM_URL || '').trim()
  if (!upstream) {
    throw new Error('Language checking is unavailable: LANGUAGETOOL_UPSTREAM_URL is not configured.')
  }
  return proxyLanguageTool(upstream, text, language)
}

async function proxyLanguageTool(
  upstream: string,
  text: string,
  language: string
): Promise<LanguageCheckResult> {
  try {
    const response = await fetch(`${upstream.replace(/\/+$/, '')}/v2/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text, language }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      throw new Error(`LanguageTool returned HTTP ${response.status}.`)
    }
    const data = await response.json()
    if (!Array.isArray(data?.matches)) {
      throw new Error('LanguageTool returned an invalid response.')
    }
    return data as LanguageCheckResult
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown upstream error.'
    throw new Error(`Language checking is unavailable: ${detail}`)
  }
}
