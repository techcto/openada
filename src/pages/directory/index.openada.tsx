import Head from 'next/head'
import type { NextPage } from 'next'
import type { ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, ExternalLink, FileSearch, Globe2, LoaderCircle, ScanSearch, ShieldCheck } from 'lucide-react'
import { OpenAdaShell } from '@components/OpenAdaShell'

type Site = {
  id: string
  hostname: string
  displayName: string
  lastScanAt: string
  scanCount: number
  pageCount: number
  latestScore: number | null
  latestGrade: string | null
  latestViolations: number
  latestLanguageErrors: number
}

type Scan = {
  id: string
  jobId?: string | null
  status: string
  url?: string
  pagesScanned: number
  maxPages: number
  score: number | null
  grade: string | null
  createdAt: string
  completedAt: string | null
  errorMessage?: string | null
}

type PageSummary = {
  id?: string
  scanId?: string
  sourceUrl?: string
  url?: string
  title?: string
  path?: string
  ada?: { score: number | null; grade: string | null; violationsCount: number; passesCount?: number; incompleteCount?: number }
  language?: { errors: number }
  latestScore?: number | null
  latestGrade?: string | null
  directory?: { scan?: { id?: string } }
}

type PageDetail = {
  id: string
  url: string
  sourceUrl: string
  title?: string
  scannedAt: string
  ada: { score: number; grade: string; violationsCount: number; passesCount: number; incompleteCount: number } | null
  languageErrors: number
  details?: {
    ada?: { violations?: unknown[] } | null
    language?: { issues?: Array<Record<string, unknown>> } | null
  }
}

type PageHistoryItem = {
  id: string
  scanJobId?: string | null
  scannedAt: string
  score: number | null
  grade: string | null
  languageErrors: number
}

type DirectoryResponse = {
  sites?: Site[]
  site?: Site
  scans?: Scan[]
  scan?: Scan
  pages?: PageSummary[]
  page?: PageDetail
  pageHistory?: PageHistoryItem[]
  error?: { message?: string }
}

async function readApiResponse(response: Response): Promise<DirectoryResponse> {
  const body = await response.text()
  try {
    return body ? JSON.parse(body) as DirectoryResponse : {}
  } catch {
    throw new Error(response.ok
      ? 'OpenADA returned an invalid response.'
      : `OpenADA returned HTTP ${response.status}. Please try again shortly.`)
  }
}

function formatDate(value?: string, withTime = false): string {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  return Number.isNaN(date.valueOf())
    ? 'Unknown date'
    : date.toLocaleString(undefined, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { month: 'short', day: 'numeric', year: 'numeric' })
}

function pageId(page: PageSummary): string {
  return page.scanId || page.directory?.scan?.id || page.id || ''
}

function siteName(site: Site): string {
  if (site.displayName && !/^openada$/i.test(site.displayName.trim())) return site.displayName
  const label = site.hostname.replace(/^www\./i, '').split('.')[0] || site.hostname
  return label.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function gradeClass(grade?: string | null, score?: number | null): string {
  const normalized = grade?.trim().toUpperCase()
  if (normalized === 'A' || (score !== null && score !== undefined && score >= 90)) return 'grade-a'
  if (normalized === 'B' || (score !== null && score !== undefined && score >= 80)) return 'grade-b'
  if (normalized === 'C' || (score !== null && score !== undefined && score >= 70)) return 'grade-c'
  if (normalized === 'D' || normalized === 'F' || (score !== null && score !== undefined)) return 'grade-d'
  return 'grade-unknown'
}

function findingValue(finding: unknown, key: string): string {
  if (!finding || typeof finding !== 'object') return ''
  const value = (finding as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : ''
}

const DirectoryPage: NextPage = () => {
  const router = useRouter()
  const pathParts = Array.isArray(router.query.slug) ? router.query.slug : []
  const selectedSite = typeof router.query.site === 'string' ? router.query.site : pathParts[0] || ''
  const selectedScan = typeof router.query.scan === 'string' ? router.query.scan : pathParts[1] === 'scans' ? pathParts[2] || '' : ''
  const selectedPage = typeof router.query.page === 'string' ? router.query.page : pathParts[3] === 'pages' ? pathParts[4] || '' : ''
  const [data, setData] = useState<DirectoryResponse>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!router.isReady) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (selectedSite) params.set('site', selectedSite)
      if (selectedScan) params.set('scan', selectedScan)
      if (selectedPage) params.set('page', selectedPage)
      try {
        const response = await fetch(`/api/v1/directory${params.toString() ? `?${params.toString()}` : ''}`)
        const nextData = await readApiResponse(response)
        if (!response.ok) throw new Error(nextData.error?.message || 'Directory unavailable.')
        if (!cancelled) setData(nextData)
      } catch (nextError) {
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : 'Directory unavailable.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [router.isReady, selectedSite, selectedScan, selectedPage])

  const site = data.site
  const scan = data.scan
  const page = data.page
  const level = page ? 'page' : scan ? 'scan' : site ? 'site' : 'sites'
  const title = page?.sourceUrl ? `Page findings | ${new URL(page.sourceUrl).hostname}` : site ? `${site.hostname} public scans` : 'Public accessibility directory'
  const sitePath = `/directory/${encodeURIComponent(selectedSite)}`
  const scanPath = `${sitePath}/scans/${encodeURIComponent(selectedScan)}`
  const canonicalPath = page ? `${scanPath}/pages/${encodeURIComponent(selectedPage)}` : scan ? scanPath : site ? sitePath : '/directory'
  const description = page?.sourceUrl
    ? `Page-level ADA and WCAG findings for ${page.sourceUrl}, including accessibility and language checks.`
    : site
      ? `Browse dated ADA reports, WCAG checks, and page findings for ${site.hostname}.`
      : 'Explore public ADA reports, WCAG checks, and website accessibility scans by site and date.'
  const structuredData = page
    ? { '@context': 'https://schema.org', '@type': 'Report', name: title, description, url: `https://openada.us${canonicalPath}`, about: 'Website accessibility and language quality' }
    : { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: `https://openada.us${canonicalPath}`, about: ['ADA compliance reports', 'WCAG accessibility testing', 'website language checks'] }
  const backHref = page
    ? scanPath
    : scan
      ? sitePath
      : site
        ? '/directory'
        : '/'

  return (
    <>
      <Head>
        <title>{title} | OpenADA</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="ADA report, ADA compliance report, WCAG report, website accessibility scan, accessibility audit, public website accessibility, Seminole County ADA report" />
        <link rel="canonical" href={`https://openada.us${canonicalPath}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <OpenAdaShell current="directory">
        <main className="directory-shell">
          <div className="directory-page">
            <div className="directory-heading">
              <div>
                {level !== 'sites' && <a className="back-link" href={backHref}><ArrowLeft size={16} aria-hidden /> Back</a>}
                <p className="eyebrow">Open web accessibility archive</p>
                <h1>{page ? page.title || new URL(page.sourceUrl).pathname : scan ? `Scan from ${formatDate(scan.completedAt || scan.createdAt)}` : site ? siteName(site) : 'The public scan directory'}</h1>
                <p className="lede">Browse public accessibility and language checks by website, scan date, page, and finding.</p>
              </div>
              <div className="directory-stat"><ScanSearch size={20} aria-hidden /><strong>{page ? page.ada?.grade || '--' : scan ? scan.pagesScanned : site ? site.scanCount : (data.sites || []).length}</strong><span>{page ? 'page grade' : scan ? 'pages in scan' : site ? 'scans recorded' : 'sites observed'}</span></div>
            </div>

            {error && <p className="error" role="alert">{error}</p>}
            {!loading && level === 'sites' && <section className="directory-intro" aria-labelledby="directory-intro-heading"><h2 id="directory-intro-heading">Public ADA and WCAG reports</h2><p>OpenADA is a public archive of automated website accessibility scans. Browse sites, compare scan dates, and open page-level findings for ADA and WCAG review. The directory is designed for organizations, public agencies, and anyone looking for a clear website accessibility report, including searches such as “Seminole County ADA report.”</p></section>}
            {loading ? <section className="loading"><LoaderCircle className="spin" size={32} aria-hidden /><strong>Loading the public archive</strong></section> : page ? <PageView page={page} history={data.pageHistory || []} siteId={selectedSite} /> : scan ? <ScanView site={site} scan={scan} pages={data.pages || []} /> : site ? <SiteView site={site} scans={data.scans || []} /> : <SiteList sites={data.sites || []} />}
          </div>
        </main>
      </OpenAdaShell>
      <style jsx global>{`
        .directory-shell { min-height: 100vh; background: #f6f8fb; color: #172033; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
        .directory-page { width: min(1180px, 100%); margin: 0 auto; padding: 28px; }
        .directory-heading { display: flex; align-items: end; justify-content: space-between; gap: 28px; margin-bottom: 34px; }
        .eyebrow { margin: 0 0 8px; color: #25635f; font-size: .78rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        h1, h2, h3, p { margin: 0; } h1 { max-width: 800px; font-size: clamp(2.1rem, 5vw, 4.4rem); line-height: .98; letter-spacing: 0; } h2 { font-size: 1.15rem; } h3 { font-size: 1rem; }
        .lede { max-width: 650px; margin-top: 18px; color: #64748b; font-size: 1.05rem; line-height: 1.55; }
        .back-link { display: inline-flex; align-items: center; gap: 7px; margin-bottom: 18px; color: #25635f; font-size: .9rem; font-weight: 850; text-decoration: none; }
        .directory-stat { min-width: 160px; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 0 10px; border-left: 3px solid #b8e7d9; padding: 8px 0 8px 16px; color: #25635f; }
        .directory-stat strong { color: #172033; font-size: 1.6rem; line-height: 1; } .directory-stat span { grid-column: 2; color: #64748b; font-size: .82rem; font-weight: 750; }
        .site-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .site-card { min-height: 214px; display: flex; flex-direction: column; border: 1px solid #dce3ea; border-radius: 8px; background: #fff; padding: 18px; color: #172033; text-decoration: none; box-shadow: 0 12px 26px rgba(23, 32, 51, .06); }
        .site-card:hover, .site-card:focus-visible, .page-row:hover, .page-row:focus-visible, .scan-row:hover, .scan-row:focus-visible { border-color: #25635f; transform: translateY(-2px); }
        .card-top, .card-meta, .section-heading, .page-row, .detail-top, .detail-metrics, .detail-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .card-top { color: #25635f; font-size: .78rem; font-weight: 800; } .site-card h2 { margin-top: 30px; } .site-card p { margin-top: 5px; color: #64748b; font-size: .9rem; overflow-wrap: anywhere; }
        .card-meta { margin-top: auto; justify-content: flex-start; padding-top: 18px; color: #64748b; font-size: .8rem; } .card-meta strong, .score { color: #b45309; font-size: 1.65rem; } .scan-status { color: #25635f; font-size: .76rem; font-weight: 900; text-transform: uppercase; }
        .empty, .loading { grid-column: 1 / -1; border: 1px dashed #b7c8c8; border-radius: 8px; background: #fff; padding: 64px 24px; text-align: center; color: #25635f; } .empty h2 { margin-top: 12px; color: #172033; } .empty p { margin-top: 8px; color: #64748b; }
        .loading { display: grid; place-items: center; gap: 12px; min-height: 220px; border-style: solid; } .spin { animation: spin .9s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
        .directory-intro { margin: 0 0 24px; border-top: 1px solid #dce3ea; border-bottom: 1px solid #dce3ea; padding: 20px 0; } .directory-intro h2 { font-size: 1.1rem; } .directory-intro p { max-width: 840px; margin-top: 8px; color: #64748b; line-height: 1.55; }
        .archive-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-top: 1px solid #dce3ea; border-bottom: 1px solid #dce3ea; padding: 18px 0; margin-bottom: 16px; } .archive-bar p { color: #64748b; font-size: .86rem; }
        .scan-list { border-top: 1px solid #dce3ea; }
        .scan-row { display: grid; grid-template-columns: 34px minmax(0, 1fr) 180px 92px 78px; align-items: center; gap: 12px; min-height: 76px; border-bottom: 1px solid #e7edf3; color: #172033; text-decoration: none; transition: transform .15s ease; }
        .scan-row-icon { color: #25635f; }
        .scan-row-main { display: grid; gap: 5px; min-width: 0; }
        .scan-row-main small { color: #64748b; overflow-wrap: anywhere; }
        .scan-row-date { color: #25635f; font-size: .82rem; font-weight: 800; text-align: right; }
        .scan-row-score { display: grid; gap: 4px; justify-items: end; }
        .scan-row-score b { font-size: 1.25rem; }
        .grade-a { color: #15803d; }
        .grade-b { color: #0f766e; }
        .grade-c { color: #b45309; }
        .grade-d { color: #be123c; }
        .grade-unknown { color: #64748b; }
        .scan-row-score small, .scan-row-pages { color: #64748b; font-size: .8rem; }
        .scan-row-pages { text-align: right; }
        .page-list { border-top: 1px solid #dce3ea; } .page-row { min-height: 76px; border-bottom: 1px solid #e7edf3; color: #172033; text-decoration: none; transition: transform .15s ease; } .page-row > span:first-child { display: grid; gap: 5px; } .page-row small { color: #64748b; overflow-wrap: anywhere; } .page-score { display: inline-flex; align-items: center; gap: 6px; font-weight: 900; }
        .page-detail { border-top: 1px solid #dce3ea; padding-top: 24px; } .detail-heading { align-items: flex-start; } .detail-heading p { color: #64748b; overflow-wrap: anywhere; } .detail-heading a { display: inline-flex; align-items: center; gap: 7px; color: #25635f; font-weight: 850; text-decoration: none; }
        .page-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; margin-top: 28px; }
        .page-main, .page-sidebar { min-width: 0; }
        .page-sidebar { display: grid; align-content: start; gap: 14px; }
        .score-panel { display: grid; gap: 10px; }
        .score-panel .metric { padding: 16px; }
        .page-preview { border: 1px solid #dce3ea; border-radius: 8px; background: #fff; overflow: hidden; }
        .section-label { border-bottom: 1px solid #e7edf3; padding: 13px 16px; color: #25635f; font-size: .78rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        .page-preview-frame { display: block; width: 100%; height: 560px; border: 0; background: #fff; }
        .preview-note { border-top: 1px solid #e7edf3; padding: 10px 14px; color: #64748b; font-size: .78rem; line-height: 1.45; }
        .history-picker { display: grid; gap: 9px; border: 1px solid #dce3ea; border-radius: 8px; background: #fff; padding: 16px; color: #25635f; font-size: .86rem; font-weight: 800; }
        .history-label { display: inline-flex; align-items: center; gap: 8px; }
        .history-picker select { width: 100%; min-height: 40px; border: 1px solid #cbd5e1; border-radius: 5px; background: #fff; color: #172033; padding: 0 10px; font: inherit; }
        .detail-metrics { align-items: stretch; margin: 28px 0; } .metric { flex: 1; border: 1px solid #dce3ea; border-radius: 8px; background: #fff; padding: 16px; } .metric span { display: block; color: #64748b; font-size: .8rem; font-weight: 800; } .metric strong { display: block; margin-top: 9px; font-size: 1.8rem; } .metric strong.grade-good { color: #15803d; } .metric strong.grade-review { color: #b45309; }
        .finding-section { margin-top: 30px; } .finding-section > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid #dce3ea; padding-bottom: 11px; } .finding-section > header span { color: #64748b; font-size: .82rem; } .finding-list { list-style: none; margin: 0; padding: 0; } .finding-list li { display: grid; gap: 6px; border-bottom: 1px solid #e7edf3; padding: 16px 0; } .finding-list strong { font-size: .95rem; } .finding-list p { color: #64748b; line-height: 1.45; } .finding-meta { color: #9f1239; font-size: .76rem; font-weight: 900; text-transform: uppercase; } .no-findings { color: #15803d; padding: 18px 0; font-weight: 800; }
        .error { margin-bottom: 18px; border: 1px solid #fecdd3; background: #fff1f2; color: #9f1239; padding: 14px; font-weight: 750; }
        @media (max-width: 900px) { .page-layout { grid-template-columns: minmax(0, 1fr) 260px; gap: 16px; } .scan-row { grid-template-columns: 30px minmax(0, 1fr) 140px 78px; } .scan-row-pages { display: none; } }
        @media (max-width: 820px) { .directory-heading { display: grid; align-items: start; } .site-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .page-layout { grid-template-columns: 1fr; } .page-sidebar { order: -1; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; } }
        @media (max-width: 620px) { .directory-page { padding: 18px; } .site-grid, .detail-metrics { grid-template-columns: 1fr; } .detail-metrics { display: grid; } .scan-row { grid-template-columns: 26px minmax(0, 1fr) 68px; gap: 8px; padding: 12px 0; } .scan-row-date { grid-column: 2; grid-row: 2; justify-self: start; text-align: left; font-size: .75rem; } .scan-row-score { grid-column: 3; grid-row: 1 / span 2; } .page-row { align-items: flex-start; padding: 14px 0; } .page-row > span:last-child { text-align: right; } .page-sidebar { grid-template-columns: 1fr; } .page-preview-frame { height: 420px; } }
      `}</style>
    </>
  )
}

function SiteList({ sites }: { sites: Site[] }) {
  return <section className="site-grid" aria-label="Scanned sites">
    {sites.length === 0 ? <div className="empty"><ShieldCheck size={24} aria-hidden /><h2>Be the first site in the directory</h2><p>Submit a public site scan and its history will appear here.</p></div> : sites.map((site) => <a className="site-card" href={`/directory/${encodeURIComponent(site.id)}`} key={site.id}>
      <div className="card-top"><Globe2 size={19} aria-hidden /><span>{formatDate(site.lastScanAt)}</span></div><h2>{siteName(site)}</h2><p>{site.hostname}</p><div className="card-meta"><strong>{site.latestGrade ?? '--'}</strong><span>{site.latestScore ?? '--'} / 100</span><span>{site.pageCount} page{site.pageCount === 1 ? '' : 's'}</span></div>
    </a>)}
  </section>
}

function SiteView({ site, scans }: { site: Site; scans: Scan[] }) {
  return <section aria-labelledby="scan-history-heading">
    <div className="archive-bar"><div><h2 id="scan-history-heading">Scan history</h2><p>Choose a dated crawl to browse its pages and findings.</p></div><span className="scan-status">{scans.length} archive record{scans.length === 1 ? '' : 's'}</span></div>
    <div className="scan-list">{scans.length === 0 ? <div className="empty"><FileSearch size={24} aria-hidden /><h2>No scans recorded yet</h2><p>This site is in the directory, but no completed archive record is available.</p></div> : scans.map((scan) => <a className="scan-row" href={`/directory/${encodeURIComponent(site.id)}/scans/${encodeURIComponent(scan.id)}`} key={scan.id}>
      <span className="scan-row-icon"><ScanSearch size={18} aria-hidden /></span><span className="scan-row-main"><strong>{scan.status === 'completed' ? 'Accessibility scan' : `Scan ${scan.status}`}</strong><small>{scan.url || site.hostname}</small></span><span className="scan-row-date">{formatDate(scan.completedAt || scan.createdAt, true)}</span><span className="scan-row-score"><b className={gradeClass(scan.grade, scan.score)}>{scan.grade ?? '--'}</b><small>{scan.score ?? '--'} / 100</small></span><span className="scan-row-pages">{scan.pagesScanned} page{scan.pagesScanned === 1 ? '' : 's'}</span>
    </a>)}</div>
  </section>
}

function ScanView({ site, scan, pages }: { site?: Site; scan: Scan; pages: PageSummary[] }) {
  const sortedPages = [...pages].sort((left, right) => {
    const leftUrl = left.sourceUrl || left.url || left.path || ''
    const rightUrl = right.sourceUrl || right.url || right.path || ''
    return leftUrl.localeCompare(rightUrl, undefined, { sensitivity: 'base' })
  })
  return <section aria-labelledby="pages-heading">
    <div className="archive-bar"><div><h2 id="pages-heading">Pages in this scan</h2><p>{site?.hostname} · scanned {formatDate(scan.completedAt || scan.createdAt, true)}</p></div><span className="scan-status">{scan.status}</span></div>
    <div className="page-list">{sortedPages.length === 0 ? <div className="empty"><FileSearch size={24} aria-hidden /><h2>No page results yet</h2><p>This scan is still processing or did not return any pages.</p></div> : sortedPages.map((page, index) => {
      const id = pageId(page)
      const url = page.sourceUrl || page.url || ''
      return <a className="page-row" href={`/directory/${encodeURIComponent(site?.id || '')}/scans/${encodeURIComponent(scan.id)}/pages/${encodeURIComponent(id)}`} key={id || url || index}>
        <span><strong>{page.title || url || `Page ${index + 1}`}</strong><small>{url || page.path}</small></span><span className={`page-score ${gradeClass(page.ada?.grade || page.latestGrade, page.ada?.score ?? page.latestScore)}`}>{page.ada?.grade || page.latestGrade || '--'} · {page.ada?.score ?? page.latestScore ?? '--'} <ExternalLink size={15} aria-hidden /></span>
      </a>
    })}</div>
  </section>
}

function PageView({ page, history, siteId }: { page: PageDetail; history: PageHistoryItem[]; siteId: string }) {
  const router = useRouter()
  const violations = page.details?.ada?.violations || []
  const languageIssues = page.details?.language?.issues || []
  const changePageScan = (pageScan: PageHistoryItem) => {
    const scan = pageScan.scanJobId || pageScan.id
    void router.push(`/directory/${encodeURIComponent(siteId)}/scans/${encodeURIComponent(scan)}/pages/${encodeURIComponent(pageScan.id)}`)
  }
  return <section className="page-detail" aria-labelledby="page-detail-heading">
    <div className="detail-heading"><div><p className="eyebrow">Page detail</p><h2 id="page-detail-heading">{page.title || new URL(page.sourceUrl).pathname}</h2><p>{page.sourceUrl}</p></div><a href={page.sourceUrl} target="_blank" rel="noreferrer">Open page <ExternalLink size={15} aria-hidden /></a></div>
    <div className="page-layout">
      <div className="page-main">
        <div className="page-preview">
          <div className="section-label">Captured page preview</div>
          <iframe className="page-preview-frame" src={page.sourceUrl} title={`Preview of ${page.title || page.sourceUrl}`} loading="lazy" sandbox="allow-scripts allow-same-origin" />
          <p className="preview-note">Some websites block embedded previews. Use Open page to view the live page directly.</p>
        </div>
        <FindingSection title="ADA checks" count={violations.length} empty="No WCAG violations found on this page.">{violations.map((finding, index) => <li key={`${findingValue(finding, 'id')}-${index}`}><span className="finding-meta">{findingValue(finding, 'impact') || 'review'} · {findingValue(finding, 'id')}</span><strong>{findingValue(finding, 'help') || 'Accessibility issue'}</strong><p>{findingValue(finding, 'description') || findingValue(finding, 'failureSummary')}</p></li>)}</FindingSection>
        <FindingSection title="Language checks" count={languageIssues.length} empty="No language issues found on this page.">{languageIssues.map((issue, index) => <li key={`${findingValue(issue, 'ruleId')}-${index}`}><span className="finding-meta">{findingValue(issue, 'type') || 'language'} · {findingValue(issue, 'ruleId')}</span><strong>{findingValue(issue, 'message') || 'Language issue'}</strong><p>{findingValue(issue, 'word')}{findingValue(issue, 'fix') ? ` → ${findingValue(issue, 'fix')}` : ''}</p></li>)}</FindingSection>
      </div>
      <aside className="page-sidebar" aria-label="Page scan summary">
        <section className="score-panel" aria-label="Page scores">
          <div className="metric"><span>ADA grade</span><strong className={page.ada && page.ada.score >= 85 ? 'grade-good' : 'grade-review'}>{page.ada?.grade || '--'}</strong></div>
          <div className="metric"><span>ADA score</span><strong>{page.ada?.score ?? '--'} / 100</strong></div>
          <div className="metric"><span>WCAG issues</span><strong className={violations.length === 0 ? 'grade-good' : 'grade-review'}>{page.ada?.violationsCount ?? violations.length}</strong></div>
          <div className="metric"><span>Language issues</span><strong className={page.languageErrors === 0 ? 'grade-good' : 'grade-review'}>{page.languageErrors}</strong></div>
        </section>
        <label className="history-picker">
          <span className="history-label"><CalendarDays size={17} aria-hidden /> View this page from another scan</span>
          <select value={page.id} onChange={(event) => { const selected = history.find((item) => item.id === event.target.value); if (selected) changePageScan(selected) }} aria-label="Choose a historical scan for this page">
            {history.map((item) => <option value={item.id} key={item.id}>{formatDate(item.scannedAt, true)} · {item.grade || '--'} · {item.score ?? '--'} / 100</option>)}
          </select>
        </label>
      </aside>
    </div>
  </section>
}

function FindingSection({ title, count, empty, children }: { title: string; count: number; empty: string; children: ReactNode }) {
  return <section className="finding-section"><header><h2>{title}</h2><span>{count} finding{count === 1 ? '' : 's'}</span></header>{count ? <ul className="finding-list">{children}</ul> : <p className="no-findings">{empty}</p>}</section>
}

export default DirectoryPage
