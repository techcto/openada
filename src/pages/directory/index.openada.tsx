import Head from 'next/head'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, Globe2, ScanSearch, ShieldCheck, Star } from 'lucide-react'
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

type Page = {
  id: string
  url: string
  path: string
  title: string
  lastScanAt: string
  scanCount: number
  latestScore: number | null
  latestGrade: string | null
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

const DirectoryPage: NextPage = () => {
  const router = useRouter()
  const selectedSite = typeof router.query.site === 'string' ? router.query.site : ''
  const [sites, setSites] = useState<Site[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [activeSite, setActiveSite] = useState<Site | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(selectedSite ? `/api/v1/directory?site=${encodeURIComponent(selectedSite)}` : '/api/v1/directory')
        const data = await readApiResponse(response)
        if (!response.ok) throw new Error(data?.error?.message || 'Directory unavailable.')
        if (selectedSite) {
          setActiveSite(data.site)
          setPages(data.pages || [])
        } else {
          setSites(data.sites || [])
        }
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Directory unavailable.')
      }
    }
    void load()
  }, [selectedSite])

  return (
    <>
      <Head>
        <title>{activeSite ? `${activeSite.hostname} accessibility scans | OpenADA` : 'Public accessibility directory | OpenADA'}</title>
        <meta name="description" content="Explore public accessibility and language scans contributed to the OpenADA directory." />
      </Head>
      <OpenAdaShell current="directory">
      <main className="directory-shell">
        <div className="directory-page">
          <div className="directory-heading">
            <div>
              {activeSite && <a className="back-link" href="/directory"><ArrowLeft size={16} aria-hidden /> Back to directory</a>}
              <p className="eyebrow">Open web accessibility index</p>
              <h1>{activeSite ? activeSite.hostname : 'The public scan directory'}</h1>
              <p className="lede">A living, public-art-style record of pages checked for accessibility and language quality.</p>
            </div>
            <div className="directory-stat"><ScanSearch size={20} aria-hidden /><strong>{activeSite ? activeSite.scanCount : sites.reduce((sum, site) => sum + site.scanCount, 0)}</strong><span>scans recorded</span></div>
          </div>

          {error && <p className="error" role="alert">{error}</p>}
          {activeSite ? (
            <section className="site-detail" aria-labelledby="pages-heading">
              <div className="site-summary">
                <div><span>Latest ADA grade</span><strong>{activeSite.latestGrade ?? '--'}</strong><small>{activeSite.latestScore ?? '--'} / 100</small></div>
                <div><span>Pages observed</span><strong>{activeSite.pageCount}</strong></div>
                <div><span>Language issues</span><strong>{activeSite.latestLanguageErrors}</strong></div>
              </div>
              <div className="section-heading"><h2 id="pages-heading">Pages in this site</h2><span>Updated {formatDate(activeSite.lastScanAt)}</span></div>
              <div className="page-list">
                {pages.map((page) => <a className="page-row" href={page.url} target="_blank" rel="noreferrer" key={page.id}>
                  <span><strong>{page.title}</strong><small>{page.path}</small></span>
                  <span className="page-score">{page.latestScore ?? '--'} <ExternalLink size={15} aria-hidden /></span>
                </a>)}
              </div>
            </section>
          ) : (
            <section className="site-grid" aria-label="Scanned sites">
              {sites.length === 0 && !error && <div className="empty"><ShieldCheck size={24} aria-hidden /><h2>Be the first page in the directory</h2><p>Add the OpenADA widget to a public page and its scan will appear here.</p></div>}
              {sites.map((site) => <a className="site-card" href={`/directory?site=${encodeURIComponent(site.id)}`} key={site.id}>
                <div className="site-card-top"><Globe2 size={19} aria-hidden /><span>{formatDate(site.lastScanAt)}</span></div>
                <h2>{site.displayName}</h2>
                <p>{site.hostname}</p>
                <div className="site-card-meta"><strong>{site.latestGrade ?? '--'}</strong><span>{site.latestScore ?? '--'} / 100</span><span>{site.pageCount} page{site.pageCount === 1 ? '' : 's'}</span></div>
              </a>)}
            </section>
          )}
        </div>
        <style jsx>{`
          .directory-shell { min-height: 100vh; background: #f6f8fb; color: #172033; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
          .directory-page { width: min(1180px, 100%); margin: 0 auto; padding: 28px; }
          .site-nav { min-height: 54px; display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 74px; }
          .brand { display: inline-flex; align-items: center; gap: 10px; color: #172033; text-decoration: none; }
          .brand-mark { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 2px solid #172033; border-radius: 11px 11px 11px 4px; background: #b8e7d9; color: #172033; box-shadow: 4px 4px 0 #172033; }
          .brand-name { font-size: 1.05rem; font-weight: 900; }
          .site-nav-links { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
          .nav-link, .back-link { display: inline-flex; align-items: center; gap: 7px; border-radius: 6px; color: #334155; font-size: .9rem; font-weight: 800; text-decoration: none; }
          .nav-link { min-height: 38px; padding: 0 11px; }
          .nav-link:hover, .nav-link.active, .nav-link:focus-visible { background: #fff; color: #25635f; }
          .directory-heading { display: flex; align-items: end; justify-content: space-between; gap: 28px; margin-bottom: 34px; }
          .eyebrow { margin: 0 0 8px; color: #25635f; font-size: .78rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
          h1, h2, p { margin: 0; }
          h1 { max-width: 760px; font-size: clamp(2.1rem, 5vw, 4.4rem); line-height: .98; letter-spacing: 0; }
          .lede { max-width: 650px; margin-top: 18px; color: #64748b; font-size: 1.05rem; line-height: 1.55; }
          .back-link { margin-bottom: 18px; color: #25635f; }
          .directory-stat { min-width: 160px; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 0 10px; border-left: 3px solid #b8e7d9; padding: 8px 0 8px 16px; color: #25635f; }
          .directory-stat strong { color: #172033; font-size: 1.6rem; line-height: 1; }
          .directory-stat span { grid-column: 2; color: #64748b; font-size: .82rem; font-weight: 750; }
          .site-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
          .site-card { min-height: 214px; display: flex; flex-direction: column; border: 1px solid #dce3ea; border-radius: 8px; background: #fff; padding: 18px; color: #172033; text-decoration: none; box-shadow: 0 12px 26px rgba(23, 32, 51, .06); }
          .site-card:hover, .site-card:focus-visible { border-color: #25635f; transform: translateY(-2px); }
          .site-card-top, .site-card-meta, .section-heading, .page-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
          .site-card-top { color: #25635f; font-size: .78rem; font-weight: 800; }
          .site-card h2 { margin-top: 30px; font-size: 1.25rem; }
          .site-card p { margin-top: 5px; color: #64748b; font-size: .9rem; overflow-wrap: anywhere; }
          .site-card-meta { margin-top: auto; justify-content: flex-start; padding-top: 18px; color: #64748b; font-size: .8rem; }
          .site-card-meta strong { color: #b45309; font-size: 1.65rem; }
          .empty { grid-column: 1 / -1; border: 1px dashed #b7c8c8; border-radius: 8px; background: #fff; padding: 64px 24px; text-align: center; color: #25635f; }
          .empty h2 { margin-top: 12px; color: #172033; }
          .empty p { margin-top: 8px; color: #64748b; }
          .site-detail { border-top: 1px solid #dce3ea; padding-top: 24px; }
          .site-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
          .site-summary div { display: grid; gap: 8px; border-left: 3px solid #b8e7d9; padding: 4px 0 4px 13px; }
          .site-summary span, .section-heading span { color: #64748b; font-size: .82rem; font-weight: 750; }
          .site-summary strong { font-size: 1.8rem; }
          .site-summary small { color: #64748b; font-size: .8rem; }
          .section-heading { margin-bottom: 12px; }
          .section-heading h2 { font-size: 1.15rem; }
          .page-list { border-top: 1px solid #dce3ea; }
          .page-row { min-height: 66px; border-bottom: 1px solid #e7edf3; color: #172033; text-decoration: none; }
          .page-row:hover strong { color: #25635f; }
          .page-row span:first-child { display: grid; gap: 4px; }
          .page-row small { color: #64748b; overflow-wrap: anywhere; }
          .page-score { display: inline-flex; align-items: center; gap: 6px; color: #b45309; font-weight: 900; }
          .error { margin-bottom: 18px; border: 1px solid #fecdd3; background: #fff1f2; color: #9f1239; padding: 14px; font-weight: 750; }
          @media (max-width: 820px) { .directory-heading { display: grid; align-items: start; } .site-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
          @media (max-width: 620px) { .directory-page { padding: 18px; } .site-nav { display: grid; gap: 16px; margin-bottom: 46px; } .site-grid, .site-summary { grid-template-columns: 1fr; } .site-nav-links { justify-content: flex-start; } .page-row { align-items: flex-start; padding: 14px 0; } }
        `}</style>
      </main>
      </OpenAdaShell>
    </>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? 'recently' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default DirectoryPage
