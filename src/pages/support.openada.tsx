import Head from 'next/head'
import type { NextPage } from 'next'
import { Bug, ExternalLink, Github, LifeBuoy, ShieldAlert } from 'lucide-react'
import { OpenAdaShell } from '@components/OpenAdaShell'

const SupportPage: NextPage = () => (
  <>
    <Head>
      <title>OpenADA Support | Report Issues on GitHub</title>
      <meta name="description" content="Get help with OpenADA, report bugs, request improvements, and disclose security concerns through the open-source GitHub repository." />
      <meta name="keywords" content="OpenADA support, OpenADA GitHub issues, accessibility scanner support, MCP support" />
    </Head>
    <OpenAdaShell current="support">
      <main className="support-page">
        <div className="support-container">
          <p className="support-eyebrow"><LifeBuoy size={16} aria-hidden /> Open source support</p>
          <h1>Help us make OpenADA better.</h1>
          <p className="support-lede">OpenADA is maintained in public. The fastest way to get help, report a bug, or suggest an improvement is to open an issue in the GitHub repository.</p>

          <section className="support-actions" aria-label="Support options">
            <a className="support-action support-action-primary" href="https://github.com/techcto/openada/issues/new/choose" target="_blank" rel="noreferrer"><Bug size={20} aria-hidden /><span><strong>Report an issue</strong><small>Open a GitHub issue with a reproducible problem or request.</small></span><ExternalLink size={16} aria-hidden /></a>
            <a className="support-action" href="https://github.com/techcto/openada/issues" target="_blank" rel="noreferrer"><Github size={20} aria-hidden /><span><strong>Browse existing issues</strong><small>Search for known bugs, discussions, and planned improvements.</small></span><ExternalLink size={16} aria-hidden /></a>
            <a className="support-action" href="https://github.com/techcto/openada/security/advisories/new" target="_blank" rel="noreferrer"><ShieldAlert size={20} aria-hidden /><span><strong>Report a security concern</strong><small>Use GitHub’s private security advisory workflow for sensitive vulnerabilities.</small></span><ExternalLink size={16} aria-hidden /></a>
          </section>

          <section className="support-section" aria-labelledby="include-heading">
            <p className="support-eyebrow">Make it actionable</p>
            <h2 id="include-heading">What to include in an issue</h2>
            <ul>
              <li>The page or API route involved, plus the scan job ID if one exists.</li>
              <li>What you expected to happen and what actually happened.</li>
              <li>Steps to reproduce, browser or client details, and relevant logs or screenshots.</li>
              <li>The OpenADA version, image tag, commit, or hosted URL you tested.</li>
            </ul>
            <p className="support-note">Please remove passwords, API keys, private URLs, personal information, and other secrets before posting. Public scans and issue content may be visible to anyone.</p>
          </section>

          <section className="support-section" aria-labelledby="resources-heading">
            <p className="support-eyebrow">Keep moving</p>
            <h2 id="resources-heading">Useful OpenADA resources</h2>
            <div className="support-resource-grid">
              <a href="/docs/mcp"><strong>MCP connection guide</strong><span>Connect ChatGPT, Codex, or Claude to the public OpenADA server.</span></a>
              <a href="/api-reference"><strong>Public API reference</strong><span>Review endpoints, request shapes, and example calls.</span></a>
              <a href="/docs"><strong>ADA guidance</strong><span>Read the human-friendly accessibility guidance and source links.</span></a>
            </div>
          </section>
        </div>
      </main>
      <style jsx global>{supportStyles}</style>
    </OpenAdaShell>
  </>
)

const supportStyles = `
  .support-page { min-height: 100vh; background: #f6f8fb; color: #172033; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  .support-container { width: min(940px, calc(100% - 40px)); margin: 0 auto; padding: 70px 0 104px; }
  .support-eyebrow { display: flex; align-items: center; gap: 7px; color: #25635f; font-size: .76rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .support-container h1 { max-width: 760px; margin-top: 14px; font-size: clamp(2.8rem, 7vw, 5.8rem); line-height: .98; font-weight: 900; letter-spacing: 0; }
  .support-lede { max-width: 730px; margin-top: 24px; color: #526176; font-size: 1.18rem; line-height: 1.65; }
  .support-actions { display: grid; gap: 12px; margin-top: 44px; }
  .support-action { display: grid; grid-template-columns: 24px minmax(0, 1fr) 18px; align-items: center; gap: 15px; padding: 20px; border: 1px solid #d7e0e8; border-radius: 7px; background: #fff; color: #172033; text-decoration: none; }
  .support-action:hover, .support-action:focus-visible { border-color: #8bd7c4; box-shadow: 0 8px 22px rgba(23, 32, 51, .08); }
  .support-action-primary { border-color: #8bd7c4; background: #eaf8f4; }
  .support-action > svg:first-child { color: #25635f; }
  .support-action > svg:last-child { color: #64748b; }
  .support-action span { display: grid; gap: 5px; }
  .support-action strong { font-size: 1.05rem; }
  .support-action small { color: #526176; font-size: .9rem; line-height: 1.45; }
  .support-section { border-top: 1px solid #dce3ea; margin-top: 64px; padding-top: 34px; }
  .support-section h2 { margin-top: 10px; font-size: clamp(1.8rem, 4vw, 2.8rem); line-height: 1.08; font-weight: 900; }
  .support-section ul { display: grid; gap: 12px; margin: 24px 0 0; padding-left: 21px; color: #526176; line-height: 1.6; }
  .support-note { margin-top: 22px; padding: 16px 18px; border-left: 3px solid #b85b13; background: #fff5ed; color: #6e3a14; line-height: 1.55; }
  .support-resource-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 24px; }
  .support-resource-grid a { display: grid; gap: 9px; padding: 20px; border: 1px solid #d7e0e8; border-radius: 7px; background: #fff; color: #25635f; text-decoration: none; }
  .support-resource-grid a:hover, .support-resource-grid a:focus-visible { border-color: #8bd7c4; }
  .support-resource-grid span { color: #526176; font-size: .9rem; line-height: 1.5; }
  @media (max-width: 760px) { .support-container { width: min(100% - 28px, 940px); padding-top: 48px; } .support-resource-grid { grid-template-columns: 1fr; } }
`

export default SupportPage
