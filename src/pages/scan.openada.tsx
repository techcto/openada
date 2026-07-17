import Head from 'next/head'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, LoaderCircle, ScanSearch } from 'lucide-react'
import { OpenAdaShell } from '@components/OpenAdaShell'

type ScanStatus = {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  url: string
  maxPages: number
  progress?: {
    pagesScanned: number
    pagesDiscovered: number
    queuedPages: number
    currentUrl: string | null
    errors: Array<{ url: string; message: string }>
  }
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

const ScanPage: NextPage = () => {
  const router = useRouter()
  const started = useRef('')
  const [status, setStatus] = useState<ScanStatus | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    const scanUrl = typeof router.query.url === 'string' ? router.query.url : ''
    const maxPages = Number(router.query.maxPages) || 50
    const key = `${scanUrl}:${maxPages}`
    if (!scanUrl || started.current === key) return
    started.current = key

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async (jobId: string) => {
      if (cancelled) return
      try {
        const response = await fetch(`/api/v1/scans/${encodeURIComponent(jobId)}`)
        const data = await readApiResponse(response)
        if (!response.ok) throw new Error(data?.error?.message || 'Unable to load scan progress.')
        if (cancelled) return
        setStatus(data)
        if (data.status === 'completed') {
          const hostname = (() => {
            try { return new URL(data.url).hostname } catch { return '' }
          })()
          await router.replace(hostname
            ? `/directory/${encodeURIComponent(hostname)}/scans/${encodeURIComponent(jobId)}`
            : `/directory?scan=${encodeURIComponent(jobId)}`)
          return
        }
        if (data.status === 'failed') {
          setError(data.error?.message || 'The site scan failed.')
          return
        }
        timer = setTimeout(() => void poll(jobId), 1200)
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load scan progress.')
          timer = setTimeout(() => void poll(jobId), 2500)
        }
      }
    }

    const start = async () => {
      try {
        const response = await fetch('/api/v1/scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: scanUrl,
            crawl: true,
            maxPages: Math.min(Math.max(maxPages, 1), 100),
            language: 'en-US',
            wcagTags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
          }),
        })
        const data = await readApiResponse(response)
        if (!response.ok) throw new Error(data?.error?.message || 'Unable to start the site scan.')
        setStatus({ ...data, progress: { pagesScanned: 0, pagesDiscovered: 1, queuedPages: 1, currentUrl: null, errors: [] } })
        await poll(data.jobId)
      } catch (nextError) {
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : 'Unable to start the site scan.')
      }
    }

    void start()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [router])

  const progress = status?.progress
  const percent = status ? Math.min(100, Math.round(((progress?.pagesScanned || 0) / status.maxPages) * 100)) : 0

  return (
    <>
      <Head>
        <title>Scanning {status?.url || 'site'} | OpenADA</title>
        <meta name="description" content="OpenADA is scanning the public pages on this site." />
      </Head>
      <OpenAdaShell current="scan">
        <main className="scan-shell">
          <a className="scan-back" href="/"><ArrowLeft size={16} aria-hidden /> Back to checker</a>
          <section className="scan-card" aria-labelledby="scan-title">
            {error ? <AlertCircle size={44} aria-hidden /> : <LoaderCircle className="scan-icon" size={52} aria-hidden />}
            <p className="eyebrow">OpenADA site scan</p>
            <h1 id="scan-title">{error ? 'Scan needs attention' : 'Scanning your site'}</h1>
            <p className="scan-url">{status?.url || (typeof router.query.url === 'string' ? router.query.url : 'Preparing scan...')}</p>
            {error ? <p className="scan-error" role="alert">{error}</p> : (
              <>
                <p className="scan-message" role="status" aria-live="polite">
                  <ScanSearch size={16} aria-hidden />
                  {status?.status === 'pending' ? 'Waiting for a scan worker...' : `Checking ${progress?.currentUrl || 'the next page'}...`}
                </p>
                <div className="progress-track" aria-label={`${percent}% complete`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                  <span style={{ width: `${percent}%` }} />
                </div>
                <div className="progress-meta"><strong>{progress?.pagesScanned || 0}</strong> of {status?.maxPages || 50} pages scanned <span>{progress?.queuedPages || 0} queued</span></div>
                {!!progress?.errors?.length && <p className="scan-note">{progress.errors.length} page{progress.errors.length === 1 ? '' : 's'} could not be checked and will be included in the report.</p>}
              </>
            )}
            {error && <a className="scan-retry" href="/">Return to checker</a>}
          </section>
        </main>
      </OpenAdaShell>
      <style jsx global>{`
        .scan-shell { min-height: calc(100vh - 222px); display: grid; align-content: start; width: min(1080px, calc(100% - 56px)); margin: 0 auto; padding: 38px 0 80px; color: #172033; }
        .scan-back { display: inline-flex; align-items: center; gap: 7px; color: #25635f; font-weight: 850; text-decoration: none; }
        .scan-card { width: min(720px, 100%); margin: 70px auto 0; padding: 58px 44px; border: 1px solid #dce3ea; border-radius: 10px; background: #fff; box-shadow: 0 22px 50px rgba(23,32,51,.09); text-align: center; }
        .scan-card > svg { color: #25635f; }
        .scan-card > svg:first-child { margin-bottom: 22px; }
        .scan-icon { animation: openada-scan-spin .9s linear infinite; transform-origin: center; }
        .eyebrow { color: #25635f; font-size: .78rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        h1 { margin: 10px 0 0; font-size: clamp(2rem, 5vw, 3.6rem); line-height: 1; letter-spacing: 0; }
        .scan-url { margin: 16px auto 0; color: #64748b; overflow-wrap: anywhere; }
        .scan-message { display: inline-flex; align-items: center; gap: 8px; margin-top: 34px; color: #25635f; font-weight: 800; }
        .progress-track { height: 12px; margin-top: 18px; overflow: hidden; border-radius: 99px; background: #e7edf3; text-align: left; }
        .progress-track span { display: block; height: 100%; border-radius: inherit; background: #25635f; transition: width .35s ease; }
        .progress-meta { display: flex; justify-content: center; gap: 7px; margin-top: 12px; color: #64748b; font-size: .86rem; }
        .progress-meta strong { color: #172033; }
        .progress-meta span { margin-left: 8px; }
        .scan-note, .scan-error { margin-top: 20px; color: #9f1239; font-weight: 750; }
        .scan-retry { display: inline-flex; margin-top: 28px; color: #25635f; font-weight: 850; }
        @keyframes openada-scan-spin { to { transform: rotate(360deg); } }
        @media (max-width: 680px) { .scan-shell { width: min(100% - 36px, 1080px); padding-top: 24px; } .scan-card { margin-top: 42px; padding: 40px 20px; } .progress-meta { flex-wrap: wrap; } }
      `}</style>
    </>
  )
}

export default ScanPage
