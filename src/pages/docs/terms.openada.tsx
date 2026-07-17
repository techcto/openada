import Head from 'next/head'
import type { NextPage } from 'next'
import { OpenAdaShell } from '@components/OpenAdaShell'

const TermsPage: NextPage = () => (
  <>
    <Head>
      <title>Terms of Use | OpenADA</title>
      <meta name="description" content="OpenADA terms of use for public page checks, site scans, API access, and MCP tools." />
    </Head>
    <OpenAdaShell current="docs">
      <main className="policy-page">
        <p className="policy-eyebrow">OpenADA trust</p>
        <h1>Terms of use</h1>
        <p className="policy-lede">OpenADA provides automated accessibility and language signals for public web development. By using the website, API, widget, or MCP server, you agree to use the service responsibly and within these terms.</p>
        <section><h2>Use public content you are allowed to test</h2><p>Only submit URLs and content that you are authorized to inspect. OpenADA is designed for public pages and will reject private-network targets. Do not use the service to bypass authentication, access confidential content, probe systems, or disrupt a website.</p></section>
        <section><h2>Automated results are not legal advice</h2><p>Scores, grades, and findings are automated engineering signals. They are not a legal opinion, accessibility certification, guarantee of compliance, or guarantee against a complaint, lawsuit, or enforcement action. Review the applicable law and guidance and include manual testing with people with disabilities.</p></section>
        <section><h2>Service limits</h2><p>Public site scans are bounded by the configured crawl limit and may be delayed, incomplete, or affected by a target site’s availability, robots policy, JavaScript behavior, or network conditions. OpenADA may rate-limit, pause, or reject requests to protect the service and public websites.</p></section>
        <section><h2>Public archive</h2><p>Site scans submitted to the public deployment may be published in the directory with their URL, scores, findings, page titles, and timestamps. Do not submit private, sensitive, or personal pages to the public service.</p></section>
        <section><h2>Open source and changes</h2><p>OpenADA source code is available in the <a href="https://github.com/techcto/openada" target="_blank" rel="noreferrer">public repository</a>. The hosted service, limits, tools, and terms may change as the project develops.</p></section>
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

export default TermsPage
