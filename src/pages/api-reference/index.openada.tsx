import Head from 'next/head'
import type { NextPage } from 'next'
import { useState } from 'react'
import { ArrowLeft, Check, Clipboard, Code2, ExternalLink, Globe2, ShieldCheck, Star } from 'lucide-react'
import { OpenAdaShell } from '@components/OpenAdaShell'

const combinedExample = `curl -X POST https://openada.us/api/v1/check \\
  -H 'Content-Type: application/json' \\
  -d '{"html":"<main><h1>Hello</h1></main>","language":"en-US"}'`
const scanExample = `curl -X POST https://openada.us/api/v1/scans \\
  -H 'Content-Type: application/json' \\
  -d '{"url":"https://example.com"}'`

const ApiReferencePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>OpenADA public API reference</title>
        <meta name="description" content="OpenADA API reference for accessibility, language, URL scanning, and public directory integrations." />
      </Head>
      <OpenAdaShell current="api">
      <main className="api-shell">
        <div className="api-page">
          <a className="back-link" href="/"><ArrowLeft size={16} aria-hidden /> Back to checker</a>
          <p className="eyebrow">Developer reference</p>
          <h1>One API for accessible, readable pages.</h1>
          <p className="lede">Connect CMS publishing workflows, WordPress, Drupal, and custom build pipelines to the same OpenADA checks.</p>

          <section className="endpoint-list" aria-labelledby="endpoints-heading">
            <div className="section-heading"><h2 id="endpoints-heading">Endpoints</h2><a href="/api/openapi" target="_blank" rel="noreferrer">OpenAPI JSON <ExternalLink size={15} aria-hidden /></a></div>
            <Endpoint method="POST" path="/api/v1/check" title="Combined check" description="Run axe-core accessibility checks and LanguageTool-compatible language checks against HTML, text, or a public URL." example={combinedExample} />
            <Endpoint method="POST" path="/api/v1/scans" title="Public directory scan" description="Fetch a public page, run both checks, and publish its latest score to the OpenADA directory." example={scanExample} />
            <Endpoint method="GET" path="/api/v1/directory" title="Browse the directory" description="List public sites. Add ?site=example.com to retrieve its observed pages and scan history." />
            <Endpoint method="POST" path="/api/v1/ada/check" title="ADA only" description="Run axe-core WCAG checks against submitted HTML." />
            <Endpoint method="POST" path="/api/v2/check" title="LanguageTool compatible" description="Use OpenADA as a LanguageTool-compatible spelling and grammar provider." />
          </section>

          <section className="notes" aria-label="Integration notes">
            <div><ShieldCheck size={20} aria-hidden /><h2>Authentication</h2><p>Public deployments can allow anonymous checks. When API keys are configured, send <code>X-API-Key</code> or <code>Authorization: Bearer ...</code>.</p></div>
            <div><Code2 size={20} aria-hidden /><h2>Widget</h2><p>Add the hosted widget to a public page to submit its URL and show a small score badge. The widget never receives private page content.</p></div>
          </section>
        </div>
        <style jsx>{`
          .api-shell { min-height: 100vh; background: #f6f8fb; color: #172033; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
          .api-page { width: min(1040px, 100%); margin: 0 auto; padding: 28px; }
          .site-nav { min-height: 54px; display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 62px; }
          .brand { display: inline-flex; align-items: center; gap: 10px; color: #172033; text-decoration: none; }
          .brand-mark { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 2px solid #172033; border-radius: 11px 11px 11px 4px; background: #b8e7d9; color: #172033; box-shadow: 4px 4px 0 #172033; }
          .brand-name { font-size: 1.05rem; font-weight: 900; }
          .site-nav-links { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
          .nav-link, .back-link, .section-heading a { display: inline-flex; align-items: center; gap: 7px; border-radius: 6px; color: #334155; font-size: .9rem; font-weight: 800; text-decoration: none; }
          .nav-link { min-height: 38px; padding: 0 11px; }
          .nav-link:hover, .nav-link.active, .nav-link:focus-visible { background: #fff; color: #25635f; }
          .back-link, .section-heading a { color: #25635f; }
          .eyebrow { margin: 40px 0 8px; color: #25635f; font-size: .78rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
          h1, h2, p { margin: 0; }
          h1 { max-width: 780px; font-size: 3.7rem; line-height: 1; }
          .lede { max-width: 680px; margin-top: 18px; color: #64748b; font-size: 1.08rem; line-height: 1.55; }
          .endpoint-list { margin-top: 54px; }
          .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 14px; }
          .section-heading h2 { font-size: 1.25rem; }
          .endpoint { border-top: 1px solid #dce3ea; padding: 20px 0; }
          .endpoint-heading { display: flex; align-items: center; gap: 10px; }
          .method { color: #25635f; font-size: .72rem; font-weight: 900; letter-spacing: .06em; }
          .endpoint-path { font-family: "SFMono-Regular", Consolas, monospace; font-size: .95rem; font-weight: 850; }
          .endpoint h3 { margin-top: 12px; font-size: 1.05rem; }
          .endpoint p { margin-top: 5px; color: #64748b; line-height: 1.45; }
          .code-wrap { position: relative; margin-top: 12px; }
          pre { overflow-x: auto; margin: 0; border: 1px solid #dce3ea; border-radius: 6px; background: #172033; color: #d7f7ec; padding: 16px; font-size: .82rem; line-height: 1.55; }
          .copy-button { position: absolute; top: 8px; right: 8px; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #496078; border-radius: 5px; background: #26364d; color: #fff; cursor: pointer; }
          .copy-button:hover, .copy-button:focus-visible { background: #25635f; }
          .notes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 34px; border-top: 1px solid #dce3ea; padding-top: 24px; }
          .notes div { display: grid; grid-template-columns: auto 1fr; gap: 8px 10px; }
          .notes svg { color: #25635f; }
          .notes p { grid-column: 2; color: #64748b; line-height: 1.5; }
          code { border-radius: 4px; background: #e8eef4; padding: 2px 5px; font-family: "SFMono-Regular", Consolas, monospace; font-size: .86em; }
          @media (max-width: 680px) { .api-page { padding: 18px; } .site-nav { display: grid; gap: 16px; margin-bottom: 46px; } .site-nav-links { justify-content: flex-start; } h1 { font-size: 2.45rem; } .notes { grid-template-columns: 1fr; } }
        `}</style>
      </main>
      </OpenAdaShell>
    </>
  )
}

function Endpoint({ method, path, title, description, example }: { method: string; path: string; title: string; description: string; example?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!example) return
    await navigator.clipboard.writeText(example)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return <article className="endpoint">
    <div className="endpoint-heading"><span className="method">{method}</span><code className="endpoint-path">{path}</code></div>
    <h3>{title}</h3>
    <p>{description}</p>
    {example && <div className="code-wrap"><pre><code>{example}</code></pre><button className="copy-button" type="button" onClick={copy} aria-label={`Copy ${path} example`} title={copied ? 'Copied' : 'Copy example'}>{copied ? <Check size={16} aria-hidden /> : <Clipboard size={16} aria-hidden />}</button></div>}
  </article>
}

export default ApiReferencePage
