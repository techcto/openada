import axe from 'axe-core'
import { JSDOM } from 'jsdom'

export type AdaCheckOptions = {
  html: string
  url?: string
  wcagTags?: string[]
}

export type AdaCheckResult = {
  score: number
  violationsCount: number
  passesCount: number
  incompleteCount: number
  inapplicableCount: number
  wcagTags: string[]
  violations: unknown[]
  passes: unknown[]
  incomplete: unknown[]
  inapplicable: unknown[]
}

const DEFAULT_WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const IMPACT_WEIGHT: Record<string, number> = {
  critical: 10,
  serious: 7,
  moderate: 4,
  minor: 2,
}

export async function checkAda(options: AdaCheckOptions): Promise<AdaCheckResult> {
  const wcagTags = normalizeTags(options.wcagTags)
  const dom = new JSDOM(options.html, {
    runScripts: 'outside-only',
    url: options.url || 'https://openada.local/',
    pretendToBeVisual: true,
  })

  const win = dom.window as unknown as Window & { axe?: typeof axe; eval: (source: string) => void }
  win.eval(axe.source)

  if (!win.axe) {
    throw new Error('Unable to initialize axe-core.')
  }

  const results = await win.axe.run(win.document, {
    runOnly: {
      type: 'tag',
      values: wcagTags,
    },
  })

  const violations = results.violations || []
  const score = Math.max(
    0,
    100 - violations.reduce((total, violation) => {
      const impact = String(violation.impact || 'minor')
      return total + (IMPACT_WEIGHT[impact] || IMPACT_WEIGHT.minor)
    }, 0)
  )

  dom.window.close()

  return {
    score,
    violationsCount: violations.length,
    passesCount: results.passes?.length || 0,
    incompleteCount: results.incomplete?.length || 0,
    inapplicableCount: results.inapplicable?.length || 0,
    wcagTags,
    violations,
    passes: results.passes || [],
    incomplete: results.incomplete || [],
    inapplicable: results.inapplicable || [],
  }
}

export function htmlToText(html: string): string {
  const dom = new JSDOM(html)
  const text = dom.window.document.body.textContent || ''
  dom.window.close()
  return text.replace(/\s+/g, ' ').trim()
}

function normalizeTags(tags?: string[]): string[] {
  const normalized = (tags || [])
    .flatMap((tag) => String(tag).split(','))
    .map((tag) => tag.trim())
    .filter(Boolean)

  return normalized.length > 0 ? Array.from(new Set(normalized)) : DEFAULT_WCAG_TAGS
}
