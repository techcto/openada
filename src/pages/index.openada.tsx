import type { GetStaticProps, NextPage } from 'next'
import type { FormEvent, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { OpenAdaShell } from '@components/OpenAdaShell'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Cloud,
  Code2,
  FileJson,
  Globe2,
  Languages,
  Play,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'

type Issue = {
  type?: string
  word?: string
  message?: string
  fix?: string | null
  ruleId?: string
  offset?: number
  length?: number
}

type CheckResponse = {
  ada?: {
    score: number
    grade: string
    violationsCount: number
    passesCount: number
    incompleteCount: number
    violations: Array<{
      id?: string
      impact?: string
      help?: string
      description?: string
      nodes?: unknown[]
    }>
  } | null
  language?: {
    errors: number
    issues: Issue[]
  }
  crawl?: {
    enabled: boolean
    maxPages: number
    pagesScanned: number
    queuedPages: number
    errors: Array<{ url: string; message: string }>
  }
  error?: {
    message: string
  }
}

const sampleHtml = `<main>
  <h1>OpenADA demo page</h1>
  <img src="/logo.png">
  <p>This langauge sample should of been checked before publish.</p>
  <a href="/docs">click here</a>
</main>`

const HomePage: NextPage = () => {
  const [html, setHtml] = useState(sampleHtml)
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<CheckResponse | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState('')

  const languageIssues = result?.language?.issues || []
  const violations = result?.ada?.violations || []
  const canCheck = useMemo(() => (html.trim().length > 0 || url.trim().length > 0) && !isChecking, [html, url, isChecking])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canCheck) return

    const submittedUrl = url.trim()
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const crawl = submitter instanceof HTMLButtonElement && submitter.value === 'site'
    if (crawl && !submittedUrl) {
      setError('Enter a public page URL to scan the site.')
      return
    }

    if (submittedUrl) {
      try {
        const parsed = new URL(submittedUrl)
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
      } catch {
        setError('Enter a valid public http:// or https:// URL.')
        return
      }
    }

    setIsChecking(true)
    setError('')

    try {
      const response = await fetch(submittedUrl ? '/api/v1/scans' : '/api/v1/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: submittedUrl ? '' : html,
          url: submittedUrl || undefined,
          crawl: crawl || undefined,
          maxPages: crawl ? 5 : undefined,
          language: 'en-US',
          wcagTags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error?.message || 'OpenADA check failed.')
      }

      setResult(data)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'OpenADA check failed.')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <OpenAdaShell current="home">
    <main className="openada-shell">
      <section className="workspace" aria-labelledby="page-title">
        <div className="masthead">
          <div>
            <h1 id="page-title">Accessibility and language checks as an API</h1>
          </div>
        </div>

        <div className="url-band">
          <div className="url-field">
            <label htmlFor="page-url"><Globe2 size={16} aria-hidden /> Page URL</label>
            <input
              id="page-url"
              form="checker-form"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/page"
              inputMode="url"
              autoComplete="url"
            />
            <button className="url-submit" type="submit" form="checker-form" value="site" disabled={!url.trim() || isChecking} aria-label="Scan this site">
              <ScanSearch size={16} aria-hidden />
              <span>{isChecking ? 'Scanning' : 'Scan site'}</span>
            </button>
            <p>OpenADA fetches public HTML pages. A URL takes priority over the editor content.</p>
          </div>
        </div>

        <div className="work-grid">
          <form id="checker-form" className="editor-pane" onSubmit={handleSubmit}>
            <div className="pane-header">
              <div>
                <h2>HTML input</h2>
                <p>Paste HTML, or test a public page URL.</p>
              </div>
              <button type="submit" disabled={!canCheck} aria-label="Run OpenADA check">
                <Play size={16} aria-hidden />
                <span>{isChecking ? 'Checking' : 'Run check'}</span>
              </button>
            </div>

            <textarea
              value={html}
              onChange={(event) => setHtml(event.target.value)}
              spellCheck={false}
              aria-label="HTML to check"
            />

            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
          </form>

          <section className="result-pane" aria-label="Check results">
            <div className="metric-row">
              <Metric
                icon={<ShieldCheck size={18} aria-hidden />}
                label="ADA score"
                value={result?.ada ? String(result.ada.score) : '--'}
                grade={result?.ada?.grade}
                tone={(result?.ada?.score || 0) >= 90 ? 'good' : 'warn'}
              />
              <Metric
                icon={<AlertTriangle size={18} aria-hidden />}
                label="WCAG issues"
                value={String(result?.ada?.violationsCount ?? 0)}
                tone={violations.length > 0 ? 'bad' : 'good'}
              />
              <Metric
                icon={<Languages size={18} aria-hidden />}
                label="Language"
                value={String(result?.language?.errors ?? 0)}
                tone={languageIssues.length > 0 ? 'warn' : 'good'}
              />
            </div>
            {result?.crawl?.enabled && (
              <p className="crawl-summary" role="status">
                <ScanSearch size={16} aria-hidden /> Scanned {result.crawl.pagesScanned} page{result.crawl.pagesScanned === 1 ? '' : 's'} on this site.
              </p>
            )}

            <div className="issues">
              <IssueSection
                title="Accessibility"
                icon={<ShieldCheck size={18} aria-hidden />}
                empty="No WCAG violations found."
              >
                {violations.slice(0, 8).map((violation) => (
                  <IssueItem
                    key={`${violation.id}-${violation.help}`}
                    label={violation.impact || 'review'}
                    title={violation.help || violation.id || 'Accessibility issue'}
                    detail={violation.description || `${violation.nodes?.length || 0} affected node(s).`}
                  />
                ))}
              </IssueSection>

              <IssueSection
                title="Language"
                icon={<Languages size={18} aria-hidden />}
                empty="No language issues found."
              >
                {languageIssues.slice(0, 8).map((issue, index) => (
                  <IssueItem
                    key={`${issue.ruleId}-${issue.offset}-${index}`}
                    label={issue.type || 'style'}
                    title={issue.message || 'Language issue'}
                    detail={issue.fix ? `${issue.word || 'Text'} -> ${issue.fix}` : issue.word || ''}
                  />
                ))}
              </IssueSection>
            </div>
          </section>
        </div>

        <section className="endpoint-band" aria-label="API endpoints">
          <EndpointCard
            icon={<FileJson size={18} aria-hidden />}
            title="Combined"
            path="POST /api/v1/check"
            description="ADA scan plus language issues in one response."
          />
          <EndpointCard
            icon={<ShieldCheck size={18} aria-hidden />}
            title="ADA"
            path="POST /api/v1/ada/check"
            description="axe-core WCAG checks for submitted HTML."
          />
          <EndpointCard
            icon={<Languages size={18} aria-hidden />}
            title="LanguageTool"
            path="POST /api/v2/check"
            description="LanguageTool-compatible endpoint for CMS providers."
          />
        </section>

        <PoweredBy />
      </section>

      <style jsx global>{`
        .openada-shell {
          min-height: 100vh;
          background: #f6f8fb;
          color: #172033;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .workspace {
          width: min(1440px, 100%);
          margin: 0 auto;
          padding: 28px;
        }

        .site-nav {
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 46px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #172033;
          text-decoration: none;
        }

        .brand-mark {
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #172033;
          border-radius: 11px 11px 11px 4px;
          background: #b8e7d9;
          color: #172033;
          box-shadow: 4px 4px 0 #172033;
        }

        .brand-name {
          font-size: 1.05rem;
          font-weight: 900;
          letter-spacing: 0.01em;
        }

        .site-nav-links {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .nav-link {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid transparent;
          border-radius: 6px;
          color: #334155;
          padding: 0 11px;
          font-size: 0.9rem;
          font-weight: 800;
          text-decoration: none;
        }

        .nav-link:hover,
        .nav-link:focus-visible {
          border-color: #c8d7d3;
          background: #ffffff;
          color: #25635f;
        }

        .masthead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 20px;
        }

        .eyebrow {
          margin: 0 0 4px;
          color: #25635f;
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        h1,
        h2,
        p {
          margin: 0;
        }

        h1 {
          width: 100%;
          max-width: none;
          font-size: 2.4rem;
          line-height: 1.08;
          font-weight: 850;
        }

        h2 {
          font-size: 1rem;
          font-weight: 800;
        }

        .status-pill {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #c8d7d3;
          border-radius: 999px;
          background: #ffffff;
          color: #25635f;
          padding: 0 14px;
          font-weight: 750;
          white-space: nowrap;
        }

        .work-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
          gap: 18px;
          align-items: stretch;
        }

        .url-band {
          margin-bottom: 18px;
          border: 1px solid #dce3ea;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(23, 32, 51, 0.05);
        }

        .url-field {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px 14px;
          padding: 15px 18px;
        }

        .url-field label {
          grid-row: 1 / span 2;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #172033;
          font-weight: 850;
          white-space: nowrap;
        }

        .url-field input {
          width: 100%;
          min-height: 38px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          outline: none;
          padding: 0 11px;
          color: #172033;
          background: #fbfcfe;
          font: inherit;
        }

        .url-field input:focus {
          border-color: #25635f;
          box-shadow: 0 0 0 3px rgba(37, 99, 95, 0.14);
        }

        .url-submit {
          grid-column: 3;
          grid-row: 1;
          min-height: 38px;
          height: 38px;
          padding: 0 13px;
        }

        .url-field p {
          grid-column: 2 / span 2;
          color: #64748b;
          font-size: 0.84rem;
        }

        .crawl-summary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #25635f;
          font-size: 0.88rem;
          font-weight: 800;
        }

        .editor-pane,
        .result-pane {
          background: #ffffff;
          border: 1px solid #dce3ea;
          border-radius: 8px;
          min-height: 620px;
          box-shadow: 0 16px 36px rgba(23, 32, 51, 0.08);
        }

        .editor-pane {
          display: flex;
          flex-direction: column;
        }

        .pane-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid #e7edf3;
          padding: 18px;
        }

        .pane-header p {
          margin-top: 4px;
          color: #64748b;
          font-size: 0.92rem;
        }

        button {
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #172033;
          border-radius: 6px;
          background: #172033;
          color: #ffffff;
          padding: 0 14px;
          font-weight: 800;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.58;
          cursor: not-allowed;
        }

        textarea {
          flex: 1;
          width: 100%;
          min-height: 520px;
          border: 0;
          resize: vertical;
          padding: 18px;
          outline: none;
          color: #172033;
          background: #fbfcfe;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 0.94rem;
          line-height: 1.58;
        }

        .inline-error {
          padding: 12px 18px;
          color: #9f1239;
          border-top: 1px solid #fecdd3;
          background: #fff1f2;
          font-weight: 700;
        }

        .result-pane {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .metric-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .metric {
          min-height: 98px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #f8fafc;
        }

        .metric-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #64748b;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .metric-value {
          font-size: 2rem;
          line-height: 1;
          font-weight: 900;
        }

        .metric-grade {
          color: #25635f;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .metric.good .metric-value {
          color: #15803d;
        }

        .metric.warn .metric-value {
          color: #b45309;
        }

        .metric.bad .metric-value {
          color: #be123c;
        }

        .issues {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .issue-section {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
        }

        .issue-section-header {
          min-height: 46px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          background: #f8fafc;
          color: #334155;
          font-weight: 850;
          border-bottom: 1px solid #e2e8f0;
        }

        .issue-list {
          display: grid;
          gap: 0;
        }

        .empty-state,
        .issue-item {
          padding: 13px 14px;
          border-bottom: 1px solid #edf2f7;
        }

        .issue-item:last-child {
          border-bottom: 0;
        }

        .empty-state {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #15803d;
          font-weight: 750;
        }

        .issue-label {
          display: inline-flex;
          align-items: center;
          min-height: 22px;
          border-radius: 999px;
          background: #e8f3f1;
          color: #25635f;
          padding: 0 8px;
          font-size: 0.72rem;
          font-weight: 850;
          text-transform: uppercase;
        }

        .issue-title {
          margin-top: 8px;
          font-weight: 820;
        }

        .issue-detail {
          margin-top: 4px;
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .endpoint-band {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .powered-by {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px 18px;
          margin-top: 28px;
          border-top: 1px solid #dce3ea;
          padding-top: 18px;
          color: #64748b;
        }

        .powered-label {
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .powered-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #334155;
          font-size: 0.9rem;
          font-weight: 800;
        }

        .powered-item svg {
          color: #25635f;
        }

        .endpoint {
          border: 1px solid #dce3ea;
          border-radius: 8px;
          background: #ffffff;
          padding: 16px;
        }

        .endpoint-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 850;
        }

        code {
          display: inline-block;
          margin-top: 10px;
          color: #172033;
          background: #eef2f7;
          border-radius: 5px;
          padding: 6px 8px;
          font-size: 0.86rem;
        }

        .endpoint p {
          margin-top: 10px;
          color: #64748b;
          line-height: 1.45;
        }

        @media (max-width: 980px) {
          .workspace {
            padding: 18px;
          }

          .site-nav {
            align-items: flex-start;
            margin-bottom: 30px;
          }

          .masthead,
          .work-grid,
          .endpoint-band {
            grid-template-columns: 1fr;
          }

          .work-grid {
            display: grid;
          }

          .masthead {
            display: grid;
          }

          .url-field {
            grid-template-columns: 1fr;
          }

          .url-field label,
          .url-field input,
          .url-field p {
            grid-column: 1;
            grid-row: auto;
          }

          .url-submit {
            grid-column: 1;
            grid-row: auto;
            justify-self: start;
          }

          .editor-pane,
          .result-pane {
            min-height: auto;
          }

          textarea {
            min-height: 360px;
          }

          .endpoint-band {
            display: grid;
          }
        }

        @media (max-width: 680px) {
          .site-nav {
            display: grid;
            gap: 16px;
          }

          .site-nav-links {
            justify-content: flex-start;
          }

          h1 {
            font-size: 1.8rem;
          }

          .pane-header,
          .metric-row {
            grid-template-columns: 1fr;
          }

          .pane-header {
            display: grid;
          }

          .metric-row {
            display: grid;
          }
        }
      `}</style>
    </main>
    </OpenAdaShell>
  )
}

function PoweredBy() {
  return (
    <section className="powered-by" aria-label="OpenADA technology partners">
      <span className="powered-label">Powered by</span>
      <span className="powered-item"><Sparkles size={17} aria-hidden /> OpenAI</span>
      <span className="powered-item"><ShieldCheck size={17} aria-hidden /> axe-core</span>
      <span className="powered-item"><Languages size={17} aria-hidden /> LanguageTool</span>
      <span className="powered-item"><Cloud size={17} aria-hidden /> AWS</span>
    </section>
  )
}

function Metric({
  icon,
  label,
  value,
  grade,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string
  grade?: string
  tone: 'good' | 'warn' | 'bad'
}) {
  return (
    <div className={`metric ${tone}`}>
      <div className="metric-top">
        <span>{label}</span>
        {icon}
      </div>
      <div className="metric-value">{value}</div>
      {grade && <span className="metric-grade">Grade {grade}</span>}
    </div>
  )
}

function IssueSection({
  title,
  icon,
  empty,
  children,
}: {
  title: string
  icon: ReactNode
  empty: string
  children: ReactNode
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <section className="issue-section">
      <div className="issue-section-header">
        {icon}
        <span>{title}</span>
      </div>
      <div className="issue-list">
        {hasChildren ? children : (
          <div className="empty-state">
            <CheckCircle2 size={16} aria-hidden />
            <span>{empty}</span>
          </div>
        )}
      </div>
    </section>
  )
}

function IssueItem({
  label,
  title,
  detail,
}: {
  label: string
  title: string
  detail: string
}) {
  return (
    <article className="issue-item">
      <span className="issue-label">{label}</span>
      <p className="issue-title">{title}</p>
      {detail ? <p className="issue-detail">{detail}</p> : null}
    </article>
  )
}

function EndpointCard({
  icon,
  title,
  path,
  description,
}: {
  icon: ReactNode
  title: string
  path: string
  description: string
}) {
  return (
    <article className="endpoint">
      <div className="endpoint-title">
        {icon}
        <span>{title}</span>
      </div>
      <code>{path}</code>
      <p>{description}</p>
    </article>
  )
}

export const getStaticProps: GetStaticProps = async () => ({
  props: {
    excludeTopNav: true,
    pageTitle: 'OpenADA',
    pageDescription: 'ADA accessibility and language quality checks as a web service.',
  },
})

export default HomePage
