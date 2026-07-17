import Head from 'next/head'
import type { NextPage } from 'next'
import type { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, FileDown, LoaderCircle, Printer, ScanSearch, ShieldCheck } from 'lucide-react'
import { OpenAdaShell } from '@components/OpenAdaShell'

type HistoryItem = {
  jobId: string
  status: string
  url: string
  pagesScanned: number
  maxPages: number
  score: number | null
  grade: string | null
  createdAt: string
  completedAt: string | null
}

type Report = {
  sourceUrl?: string
  grade?: string | null
  ada?: { score: number; grade: string; violationsCount: number; violations?: Array<{ id?: string; impact?: string; help?: string }> } | null
  language?: { errors: number; issues?: Array<{ message?: string; word?: string; fix?: string | null }> }
  crawl?: { pagesScanned: number; maxPages: number; errors: Array<{ url: string; message: string }> }
  pages?: Array<{ sourceUrl: string; title: string; ada: { score: number; grade: string; violationsCount: number }; language: { errors: number } }>
}

type JobResponse = {
  status: string
  url: string
  result: Report | null
  error?: { message: string } | null
}

async function readApiResponse(response: Response): Promise<any> {
  const body = await response.text()
  try {
    return body ? JSON.parse(body) : {}
  } catch {
    throw new Error(response.ok
      ? 'OpenADA returned an invalid response.'
      : `OpenADA returned HTTP ${response.status}. Please try again shortly.`)
  }
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? 'Unknown date' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

const ReportPage: NextPage = () => {
  const router = useRouter()
  const jobId = typeof router.query.jobId === 'string' ? router.query.jobId : ''
  const [job, setJob] = useState<JobResponse | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!router.isReady || !jobId) return
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch(`/api/v1/scans/${encodeURIComponent(jobId)}`)
        const data = await readApiResponse(response)
        if (!response.ok) throw new Error(data?.error?.message || 'Unable to load this report.')
        if (cancelled) return
        if (data.status === 'pending' || data.status === 'running') {
          await router.replace(`/scan?url=${encodeURIComponent(data.url)}&maxPages=${data.maxPages || 50}`)
          return
        }
        setJob(data)
        if (data.status === 'failed') {
          setError(data.error?.message || 'The scan failed.')
          return
        }
        const historyResponse = await fetch(`/api/v1/scans?url=${encodeURIComponent(data.url)}`)
        const historyData = await readApiResponse(historyResponse)
        if (!historyResponse.ok) throw new Error(historyData?.error?.message || 'Unable to load scan history.')
        if (!cancelled) setHistory(historyData.scans || [])
      } catch (nextError) {
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : 'Unable to load this report.')
      }
    }
    void load()
    return () => { cancelled = true }
  }, [router, jobId])

  const report = job?.result
  const selectedHistory = history.find((item) => item.jobId === jobId)
  const selectedIndex = history.findIndex((item) => item.jobId === jobId)
  const previous = selectedIndex >= 0 ? history.slice(selectedIndex + 1).find((item) => item.status === 'completed' && item.score !== null) : undefined
  const scoreChange = selectedHistory?.score !== null && selectedHistory?.score !== undefined && previous?.score !== null && previous?.score !== undefined
    ? selectedHistory.score - previous.score
    : null

  return (
    <>
      <Head>
        <title>{report?.sourceUrl ? `Accessibility report | ${new URL(report.sourceUrl).hostname}` : 'Accessibility report'} | OpenADA</title>
        <meta name="description" content="OpenADA accessibility and language scan report." />
      </Head>
      <OpenAdaShell current="report">
        <main className="report-shell">
          <div className="report-actions"><a className="back-link" href="/"><ArrowLeft size={16} aria-hidden /> Back to checker</a><div><button type="button" onClick={() => window.print()}><Printer size={16} aria-hidden /> Print / save PDF</button><button type="button" onClick={() => window.print()}><FileDown size={16} aria-hidden /> Download PDF</button></div></div>
          {error ? <section className="report-error" role="alert"><h1>Report unavailable</h1><p>{error}</p></section> : !report ? <section className="report-loading"><LoaderCircle className="report-spin" size={42} aria-hidden /><h1>Loading report</h1></section> : (
            <>
              <header className="report-heading"><p className="eyebrow">OpenADA accessibility report</p><h1>{new URL(report.sourceUrl || job?.url || 'https://openada.local').hostname}</h1><p className="report-url">{report.sourceUrl || job?.url}</p><p className="report-date">Scanned {formatDate(selectedHistory?.completedAt || selectedHistory?.createdAt || '')}</p></header>
              <section className="scan-picker" aria-label="Scan history"><CalendarDays size={18} aria-hidden /><label htmlFor="scan-history">View scan</label><select id="scan-history" value={jobId} onChange={(event) => router.push(`/report?jobId=${encodeURIComponent(event.target.value)}`)}>{history.filter((item) => item.status === 'completed').map((item) => <option value={item.jobId} key={item.jobId}>{formatDate(item.completedAt || item.createdAt)} - {item.grade || '--'} ({item.score ?? '--'}/100)</option>)}</select>{scoreChange !== null && <span className={scoreChange >= 0 ? 'change-positive' : 'change-negative'}>{scoreChange >= 0 ? '+' : ''}{scoreChange} points since previous scan</span>}</section>
              <section className="report-metrics"><Metric label="ADA score" value={`${report.ada?.score ?? '--'}`} detail={report.ada?.grade || '--'} icon={<ShieldCheck size={18} aria-hidden />} /><Metric label="WCAG issues" value={`${report.ada?.violationsCount ?? 0}`} detail="accessibility findings" icon={<ScanSearch size={18} aria-hidden />} /><Metric label="Language issues" value={`${report.language?.errors ?? 0}`} detail="readability findings" icon={<CheckCircle2 size={18} aria-hidden />} /><Metric label="Pages scanned" value={`${report.crawl?.pagesScanned ?? report.pages?.length ?? 0}`} detail={`of ${report.crawl?.maxPages ?? report.pages?.length ?? 0} requested`} icon={<CalendarDays size={18} aria-hidden />} /></section>
              <section className="report-section"><div className="section-title"><h2>Pages in this scan</h2><span>{report.pages?.length || 0} page summaries</span></div><div className="page-table">{(report.pages || []).map((page) => <a href={page.sourceUrl} target="_blank" rel="noreferrer" className="page-row" key={page.sourceUrl}><span><strong>{page.title || page.sourceUrl}</strong><small>{page.sourceUrl}</small></span><span><b>{page.ada.grade}</b><small>{page.ada.score}/100 · {page.ada.violationsCount} WCAG issues · {page.language.errors} language issues</small></span></a>)}</div></section>
              <section className="report-section"><div className="section-title"><h2>Accessibility findings</h2><span>{report.ada?.violationsCount ?? 0} issues on the first page</span></div>{report.ada?.violations?.length ? <ul className="finding-list">{report.ada.violations.map((violation, index) => <li key={`${violation.id}-${index}`}><strong>{violation.help || violation.id || 'Accessibility issue'}</strong><span>{violation.impact || 'review'}</span></li>)}</ul> : <p className="empty-report">No WCAG violations found on the first page.</p>}</section>
            </>
          )}
        </main>
      </OpenAdaShell>
      <style jsx global>{`
        .report-shell { min-height: calc(100vh - 222px); width: min(1120px, calc(100% - 56px)); margin: 0 auto; padding: 36px 0 80px; color: #172033; }
        .report-actions, .report-actions > div, .scan-picker, .section-title, .page-row, .report-metrics { display: flex; align-items: center; }
        .report-actions { justify-content: space-between; gap: 20px; }
        .report-actions > div { gap: 8px; }
        .back-link { display: inline-flex; align-items: center; gap: 7px; color: #25635f; font-weight: 850; text-decoration: none; }
        .report-actions button { display: inline-flex; align-items: center; gap: 7px; min-height: 38px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #25635f; padding: 0 12px; font-weight: 800; cursor: pointer; }
        .report-heading { border-bottom: 1px solid #dce3ea; padding: 74px 0 32px; }
        .eyebrow { color: #25635f; font-size: .78rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        h1 { margin: 10px 0 0; font-size: clamp(2.2rem, 6vw, 5rem); line-height: 1; letter-spacing: 0; }
        .report-url, .report-date { margin-top: 14px; color: #64748b; overflow-wrap: anywhere; }
        .report-date { font-size: .85rem; }
        .scan-picker { flex-wrap: wrap; gap: 9px; margin-top: 22px; border: 1px solid #dce3ea; border-radius: 8px; background: #fff; padding: 13px 15px; color: #25635f; font-weight: 800; }
        .scan-picker select { min-height: 34px; max-width: 100%; border: 1px solid #cbd5e1; border-radius: 5px; background: #fff; color: #172033; padding: 0 8px; font: inherit; }
        .change-positive, .change-negative { margin-left: auto; font-size: .84rem; } .change-positive { color: #15803d; } .change-negative { color: #be123c; }
        .report-metrics { align-items: stretch; gap: 12px; margin-top: 22px; }
        .report-metrics > div { flex: 1; min-width: 0; border: 1px solid #dce3ea; border-radius: 8px; background: #fff; padding: 17px; }
        .metric-label { display: flex; align-items: center; gap: 7px; color: #64748b; font-size: .84rem; font-weight: 800; } .metric-value { display: block; margin-top: 12px; font-size: 2rem; } .metric-detail { color: #64748b; font-size: .78rem; }
        .report-section { margin-top: 34px; } .section-title { justify-content: space-between; gap: 15px; border-bottom: 1px solid #dce3ea; padding-bottom: 11px; } .section-title h2 { font-size: 1.2rem; } .section-title span { color: #64748b; font-size: .83rem; }
        .page-table { border-top: 1px solid #e7edf3; } .page-row { justify-content: space-between; gap: 20px; min-height: 72px; border-bottom: 1px solid #e7edf3; color: #172033; text-decoration: none; } .page-row:hover strong { color: #25635f; } .page-row > span { display: grid; gap: 5px; } .page-row > span:last-child { justify-items: end; text-align: right; } .page-row small { color: #64748b; font-size: .8rem; overflow-wrap: anywhere; } .page-row b { color: #b45309; font-size: 1.15rem; }
        .finding-list { list-style: none; margin: 0; padding: 0; } .finding-list li { display: flex; justify-content: space-between; gap: 15px; border-bottom: 1px solid #e7edf3; padding: 14px 0; } .finding-list span { color: #9f1239; font-size: .8rem; font-weight: 850; text-transform: uppercase; } .empty-report { color: #15803d; padding: 18px 0; font-weight: 800; }
        .report-loading, .report-error { margin: 80px auto; max-width: 700px; padding: 48px; border: 1px solid #dce3ea; border-radius: 8px; background: #fff; text-align: center; } .report-loading h1, .report-error h1 { font-size: 2rem; } .report-spin { color: #25635f; animation: openada-spin .9s linear infinite; } .report-error p { margin-top: 14px; color: #9f1239; }
        @keyframes openada-spin { to { transform: rotate(360deg); } }
        @media print { .global-header, .global-footer, .report-actions, .scan-picker { display: none !important; } .report-shell { width: 100%; padding: 0; } .report-heading { padding-top: 0; } .report-metrics > div, .report-section { break-inside: avoid; } }
        @media (max-width: 720px) { .report-shell { width: min(100% - 36px, 1120px); } .report-actions { align-items: flex-start; flex-direction: column; } .report-actions > div { flex-wrap: wrap; } .report-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); } .change-positive, .change-negative { width: 100%; margin-left: 0; } .page-row { align-items: flex-start; flex-direction: column; padding: 14px 0; } .page-row > span:last-child { justify-items: start; text-align: left; } }
      `}</style>
    </>
  )
}

function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return <div><span className="metric-label">{icon}{label}</span><strong className="metric-value">{value}</strong><small className="metric-detail">{detail}</small></div>
}

export default ReportPage
