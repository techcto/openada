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

type RuleSpec = {
  id: string
  pattern: RegExp
  message: string
  shortMessage: string
  issueType: LanguageIssueType
  replacement?: string
  description: string
}

const SPELLING_RULES: RuleSpec[] = [
  ['ACCESSIBILITY_SPELLING', /\baccesibility\b/gi, 'Possible spelling mistake: accessibility.', 'Spelling', 'misspelling', 'accessibility'],
  ['LANGUAGE_SPELLING', /\blangauge\b/gi, 'Possible spelling mistake: language.', 'Spelling', 'misspelling', 'language'],
  ['RECEIVE_SPELLING', /\brecieve\b/gi, 'Possible spelling mistake: receive.', 'Spelling', 'misspelling', 'receive'],
  ['SEPARATE_SPELLING', /\bseperate\b/gi, 'Possible spelling mistake: separate.', 'Spelling', 'misspelling', 'separate'],
  ['DEFINITELY_SPELLING', /\bdefinately\b/gi, 'Possible spelling mistake: definitely.', 'Spelling', 'misspelling', 'definitely'],
  ['THE_SPELLING', /\bteh\b/gi, 'Possible spelling mistake: the.', 'Spelling', 'misspelling', 'the'],
  ['COMPLIANCE_SPELLING', /\bcomplaince\b/gi, 'Possible spelling mistake: compliance.', 'Spelling', 'misspelling', 'compliance'],
].map(([id, pattern, message, shortMessage, issueType, replacement]) => ({
  id,
  pattern,
  message,
  shortMessage,
  issueType,
  replacement,
  description: message,
} as RuleSpec))

const GRAMMAR_RULES: RuleSpec[] = [
  {
    id: 'SHOULD_OF',
    pattern: /\b(should|could|would) of\b/gi,
    message: 'Use "have" after should, could, or would.',
    shortMessage: 'Grammar',
    issueType: 'grammar',
    description: 'Modal verb followed by "of".',
  },
  {
    id: 'A11Y_ALT_TEXT',
    pattern: /\bimage of image\b/gi,
    message: 'Avoid redundant image phrasing in alt text.',
    shortMessage: 'Alt text',
    issueType: 'style',
    description: 'Redundant alt text wording.',
  },
  {
    id: 'DOUBLE_WORD',
    pattern: /\b([a-z]+)\s+\1\b/gi,
    message: 'Repeated word.',
    shortMessage: 'Repeated word',
    issueType: 'grammar',
    description: 'A word appears twice in a row.',
  },
]

const STYLE_RULES: RuleSpec[] = [
  {
    id: 'VERY_STYLE',
    pattern: /\bvery\b/gi,
    message: 'Consider a more specific word than "very".',
    shortMessage: 'Style',
    issueType: 'style',
    description: 'Weak intensifier.',
  },
  {
    id: 'CLICK_HERE_A11Y',
    pattern: /\bclick here\b/gi,
    message: 'Use descriptive link text instead of "click here".',
    shortMessage: 'Link text',
    issueType: 'style',
    description: 'Non-descriptive link text.',
  },
  {
    id: 'UTILIZE_STYLE',
    pattern: /\butilize\b/gi,
    message: 'Consider "use" instead of "utilize".',
    shortMessage: 'Style',
    issueType: 'style',
    replacement: 'use',
    description: 'Plain language suggestion.',
  },
]

const RULES = [...SPELLING_RULES, ...GRAMMAR_RULES, ...STYLE_RULES]

export const supportedLanguages = [
  { name: 'English (US)', code: 'en-US', longCode: 'en-US' },
  { name: 'English', code: 'en', longCode: 'en' },
]

export async function checkLanguage(text: string, language = 'en-US'): Promise<LanguageCheckResult> {
  const upstream = String(process.env.LANGUAGETOOL_UPSTREAM_URL || '').trim()
  if (upstream) {
    const proxied = await proxyLanguageTool(upstream, text, language)
    if (proxied) return proxied
  }

  const matches = RULES.flatMap((rule) => collectMatches(rule, text))
    .sort((a, b) => a.offset - b.offset)

  return {
    software: {
      name: 'OpenADA Language Check',
      version: '0.1.0',
      apiVersion: 1,
    },
    warnings: {
      incompleteResults: false,
    },
    language: {
      name: language.toLowerCase().startsWith('en') ? 'English' : language,
      code: language || 'en-US',
    },
    matches,
  }
}

async function proxyLanguageTool(
  upstream: string,
  text: string,
  language: string
): Promise<LanguageCheckResult | null> {
  try {
    const response = await fetch(`${upstream.replace(/\/+$/, '')}/v2/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text, language }),
    })

    if (!response.ok) return null
    const data = await response.json()
    if (!Array.isArray(data?.matches)) return null
    return data as LanguageCheckResult
  } catch {
    return null
  }
}

function collectMatches(rule: RuleSpec, text: string): LanguageMatch[] {
  const matches: LanguageMatch[] = []
  const pattern = new RegExp(rule.pattern.source, rule.pattern.flags)
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const offset = match.index
    const length = match[0].length
    matches.push(toLanguageMatch(rule, text, offset, length, match[0]))

    if (match.index === pattern.lastIndex) {
      pattern.lastIndex += 1
    }
  }

  return matches
}

function toLanguageMatch(
  rule: RuleSpec,
  text: string,
  offset: number,
  length: number,
  foundText: string
): LanguageMatch {
  const contextStart = Math.max(0, offset - 40)
  const contextEnd = Math.min(text.length, offset + length + 40)
  const contextText = text.slice(contextStart, contextEnd)
  const sentence = getSentence(text, offset)
  const replacement = rule.replacement || inferReplacement(rule, foundText)

  return {
    message: rule.message,
    shortMessage: rule.shortMessage,
    offset,
    length,
    replacements: replacement ? [{ value: preserveCase(foundText, replacement) }] : [],
    context: {
      text: contextText,
      offset: offset - contextStart,
      length,
    },
    sentence,
    rule: {
      id: rule.id,
      description: rule.description,
      issueType: rule.issueType,
      category: {
        id: rule.issueType.toUpperCase(),
        name: categoryName(rule.issueType),
      },
    },
  }
}

function inferReplacement(rule: RuleSpec, foundText: string): string {
  if (rule.id === 'SHOULD_OF') return foundText.replace(/\bof\b/i, 'have')
  if (rule.id === 'DOUBLE_WORD') return foundText.split(/\s+/)[0] || ''
  return ''
}

function preserveCase(source: string, replacement: string): string {
  if (!source) return replacement
  if (source === source.toUpperCase()) return replacement.toUpperCase()
  if (source[0] === source[0].toUpperCase()) {
    return `${replacement[0]?.toUpperCase() || ''}${replacement.slice(1)}`
  }
  return replacement
}

function getSentence(text: string, offset: number): string {
  const before = text.slice(0, offset)
  const after = text.slice(offset)
  const sentenceStart = Math.max(
    before.lastIndexOf('.'),
    before.lastIndexOf('!'),
    before.lastIndexOf('?')
  ) + 1
  const sentenceEndCandidates = ['.', '!', '?']
    .map((marker) => {
      const index = after.indexOf(marker)
      return index === -1 ? -1 : offset + index + 1
    })
    .filter((index) => index > -1)
  const sentenceEnd = sentenceEndCandidates.length > 0
    ? Math.min(...sentenceEndCandidates)
    : text.length

  return text.slice(sentenceStart, sentenceEnd).trim()
}

function categoryName(issueType: LanguageIssueType): string {
  if (issueType === 'misspelling') return 'Possible Typo'
  if (issueType === 'grammar') return 'Grammar'
  return 'Style'
}
