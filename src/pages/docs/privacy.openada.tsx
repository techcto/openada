import Head from 'next/head'
import type { NextPage } from 'next'
import { OpenAdaShell } from '@components/OpenAdaShell'

const PrivacyPage: NextPage = () => (
  <>
    <Head>
      <title>Privacy Policy | OpenADA</title>
      <meta name="description" content="OpenADA privacy policy for public page checks, site scans, and the public accessibility archive." />
    </Head>
    <OpenAdaShell current="docs">
      <main className="policy-page">
        <p className="policy-eyebrow">OpenADA trust</p>
        <h1>Privacy policy</h1>
        <p className="policy-lede">OpenADA is a public accessibility and language-checking service. This policy explains what happens when you submit a public URL or use the OpenADA website, API, or MCP server.</p>
        <section><h2>Public URLs and scan results</h2><p>When you submit a public URL, OpenADA fetches that page and may follow same-host links when you start a site scan. The URL, page metadata, scores, findings, crawl status, and timestamps may be stored in the public directory so people can review accessibility progress over time. Do not submit private, sensitive, authenticated, or personal pages.</p></section>
        <section><h2>HTML and text submissions</h2><p>HTML and text sent to the checker or API are processed to produce accessibility and language findings. Do not include secrets or personal information in test content. Deployments may retain request and operational logs for security, reliability, and debugging.</p></section>
        <section><h2>Cookies and accounts</h2><p>The public demo does not require an OpenADA account. The service may use standard infrastructure logs and essential browser storage needed to operate the website. OpenADA does not sell submitted scan content.</p></section>
        <section><h2>Third-party services</h2><p>OpenADA uses axe-core, LanguageTool-compatible analysis, AWS infrastructure, and MCP client connections to provide the service. When an upstream language provider is configured, submitted language content may be sent to that provider according to its own terms and privacy policy.</p></section>
        <section><h2>Questions</h2><p>For product and integration information, see the <a href="/api-reference">API reference</a>, <a href="/docs">guidance</a>, and <a href="https://github.com/techcto/openada" target="_blank" rel="noreferrer">open-source repository</a>.</p></section>
      </main>
      <style jsx global>{policyStyles}</style>
    </OpenAdaShell>
  </>
)

const policyStyles = `
  .policy-page { width: min(820px, calc(100% - 40px)); margin: 0 auto; padding: 76px 0 100px; color: #172033; }
  .policy-eyebrow { color: #25635f; font-size: .76rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
  .policy-page h1 { margin-top: 12px; font-size: clamp(2.5rem, 6vw, 4.7rem); line-height: 1; font-weight: 900; }
  .policy-lede { margin-top: 22px; color: #526176; font-size: 1.15rem; line-height: 1.7; }
  .policy-page section { border-top: 1px solid #dce3ea; margin-top: 36px; padding-top: 24px; }
  .policy-page h2 { font-size: 1.3rem; font-weight: 900; }
  .policy-page section p { margin-top: 12px; color: #526176; line-height: 1.7; }
  .policy-page a { color: #25635f; font-weight: 800; }
  @media (max-width: 680px) { .policy-page { width: min(100% - 28px, 820px); padding-top: 48px; } }
`

export default PrivacyPage
