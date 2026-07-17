import Head from 'next/head'
import type { NextPage } from 'next'
import { ArrowLeft, Bot, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react'
import { OpenAdaShell } from '@components/OpenAdaShell'

const McpDocsPage: NextPage = () => (
  <>
    <Head>
      <title>Connect OpenADA to AI Tools with MCP | OpenADA</title>
      <meta name="description" content="Connect OpenADA's public Model Context Protocol server to ChatGPT, OpenAI Codex, Claude Code, and MCP Inspector for accessibility checks and site scans." />
      <meta name="keywords" content="OpenADA MCP, Model Context Protocol accessibility, ChatGPT MCP, Codex MCP, Claude Code MCP, website accessibility AI agent" />
      <meta property="og:title" content="Connect OpenADA to AI Tools with MCP" />
      <meta property="og:description" content="Use ChatGPT, Codex, or Claude to check public pages, run site scans, follow progress, and compare accessibility history." />
    </Head>
    <OpenAdaShell current="mcp">
      <main className="mcp-docs-page">
        <div className="mcp-docs-container">
          <a className="mcp-back-link" href="/docs"><ArrowLeft size={16} aria-hidden /> Back to ADA guidance</a>
          <section className="mcp-hero" aria-labelledby="mcp-title">
            <p className="mcp-eyebrow"><Bot size={16} aria-hidden /> OpenADA developer docs</p>
            <h1 id="mcp-title">Put accessibility checks inside your AI tools.</h1>
            <p className="mcp-lede">OpenADA exposes a public, stateless Model Context Protocol server. Connect it once, then ask ChatGPT, Codex, Claude Code, or another MCP client to check a page, queue a bounded website crawl, follow progress, and explore public scan history.</p>
            <div className="mcp-endpoint"><span>MCP endpoint</span><code>https://openada.us/mcp</code></div>
          </section>

          <section className="mcp-section" aria-labelledby="quick-start-title">
            <div className="mcp-section-heading"><p className="mcp-eyebrow">Quick start</p><h2 id="quick-start-title">One endpoint, four tools</h2><p>OpenADA returns structured results that AI clients can summarize and act on. Site scans are asynchronous, so a client receives a job ID immediately and polls durable progress instead of waiting on a long request.</p></div>
            <div className="mcp-tool-grid">
              <ToolCard title="Check a page" detail="Run axe-core accessibility checks and LanguageTool-compatible language analysis against HTML, text, or a public URL." />
              <ToolCard title="Scan a website" detail="Queue a same-host crawl with a configurable limit of up to 100 public pages." />
              <ToolCard title="Follow progress" detail="Read pages scanned, pages discovered, current URL, errors, score, grade, and the completed report." />
              <ToolCard title="Browse the archive" detail="Inspect public sites, scan history, page findings, and changes over time." />
            </div>
          </section>

          <section className="mcp-section" aria-labelledby="clients-title">
            <div className="mcp-section-heading"><p className="mcp-eyebrow">Connect a client</p><h2 id="clients-title">ChatGPT, Codex, and Claude</h2><p>Use the instructions for the tool you already work in. The public demo is anonymous; protected deployments can require a bearer token or API key.</p></div>
            <div className="mcp-client-list">
              <ClientCard number="01" title="ChatGPT" description="ChatGPT custom MCP servers are added from Developer Mode. The labels may appear as Apps, Connectors, or New Plugin depending on the workspace surface." steps={[
                'Open ChatGPT Settings, go to Apps & Connectors, open Advanced settings, and turn on Developer mode.',
                'Return to Apps & Connectors and choose Create app or New Plugin.',
                'Set the name to OpenADA and paste https://openada.us/mcp into Server URL. Use /mcp, not an /sse URL.',
                'For the public OpenADA demo, choose None or No authentication if that option is available. Leave OAuth credentials empty; protected deployments need their own OAuth setup.',
                'Review the custom MCP server warning, check “I understand and want to continue,” then select Create.',
                'Start a new chat, open the tools or connectors menu, enable OpenADA, and ask it to check a public page or start a scan.',
              ]} code="https://openada.us/mcp" link="https://learn.chatgpt.com/docs/submit-plugins" linkText="Open the ChatGPT submission guide" />
              <ClientCard number="02" title="OpenAI Codex CLI or IDE" description="Add the server from Codex MCP settings, or place this configuration in ~/.codex/config.toml." steps={[
                'Add the remote MCP server in Codex settings.',
                'Restart or refresh Codex, then approve the OpenADA tools when prompted.',
              ]} code={'[mcp_servers.openada]\nurl = "https://openada.us/mcp"\ndefault_tools_approval_mode = "writes"'} link="https://developers.openai.com/codex/mcp" linkText="Read the Codex MCP guide" />
              <ClientCard number="03" title="Claude custom connector" description="Claude uses a custom connector for remote MCP servers. Add OpenADA from the Claude settings UI, then enable it in a conversation." steps={[
                'Open Claude Settings and choose Connectors.',
                'Select Add custom connector.',
                'Set the name to OpenADA and paste https://openada.us/mcp into Remote MCP server URL.',
                'Leave the optional OAuth Client ID and OAuth Client Secret blank for the public OpenADA demo, then select Add.',
                'Enable OpenADA in a conversation and ask it to check a public page or inspect scan history.',
              ]} code="https://openada.us/mcp" link="https://code.claude.com/docs/en/mcp" linkText="Read the Claude MCP guide" />
            </div>
          </section>

          <section className="mcp-section mcp-prompts-section" aria-labelledby="prompts-title">
            <div className="mcp-section-heading"><p className="mcp-eyebrow">Try it</p><h2 id="prompts-title">Useful prompts</h2><p>These prompts make the intended workflow clear to an AI client:</p></div>
            <div className="mcp-prompt-list"><code>Check https://example.gov and summarize the most serious accessibility findings.</code><code>Start a 50-page scan for https://example.gov, report progress, and tell me the final grade.</code><code>Show the latest archived scan for www.example.gov and explain whether the score improved.</code></div>
          </section>

          <section className="mcp-section mcp-safety-section" aria-labelledby="safety-title">
            <div className="mcp-section-heading"><p className="mcp-eyebrow"><ShieldCheck size={16} aria-hidden /> Responsible use</p><h2 id="safety-title">Built for public, reviewable work</h2></div>
            <div className="mcp-safety-grid"><p><CheckCircle2 size={18} aria-hidden /> Only public URLs are fetched. Same-host crawling is bounded and protected against private-network targets.</p><p><CheckCircle2 size={18} aria-hidden /> The MCP server is stateless; durable scan progress lives in the service so agents can reconnect and continue.</p><p><CheckCircle2 size={18} aria-hidden /> Automated scores are engineering signals, not legal advice or a certification of ADA compliance.</p></div>
            <p className="mcp-doc-links">Need the implementation details? Read the <a href="https://github.com/techcto/openada/blob/main/devops/mcp/README.md" target="_blank" rel="noreferrer">MCP integration README <ExternalLink size={14} aria-hidden /></a> or inspect the <a href="/api-reference">public API reference</a>.</p>
          </section>
        </div>
      </main>
      <style jsx global>{mcpStyles}</style>
    </OpenAdaShell>
  </>
)

function ToolCard({ title, detail }: { title: string; detail: string }) {
  return <article className="mcp-tool-card"><Bot size={18} aria-hidden /><h3>{title}</h3><p>{detail}</p></article>
}

function ClientCard({ number, title, description, steps, code, link, linkText }: { number: string; title: string; description: string; steps: string[]; code: string; link: string; linkText: string }) {
  return <article className="mcp-client-card"><span className="mcp-card-number">{number}</span><div><h3>{title}</h3><p>{description}</p><ol className="mcp-client-steps">{steps.map((step) => <li key={step}>{step}</li>)}</ol><pre><code>{code}</code></pre><a href={link} target="_blank" rel="noreferrer">{linkText} <ExternalLink size={14} aria-hidden /></a></div></article>
}

const mcpStyles = `
  .mcp-docs-page { min-height: 100vh; background: #f6f8fb; color: #172033; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .mcp-docs-container { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 34px 0 96px; }
  .mcp-back-link, .mcp-client-card a, .mcp-doc-links a { color: #25635f; font-weight: 850; text-decoration: none; }
  .mcp-back-link { display: inline-flex; align-items: center; gap: 7px; }
  .mcp-back-link:hover, .mcp-back-link:focus-visible, .mcp-client-card a:hover, .mcp-client-card a:focus-visible, .mcp-doc-links a:hover, .mcp-doc-links a:focus-visible { text-decoration: underline; }
  .mcp-hero { border-bottom: 1px solid #dce3ea; padding: 72px 0 62px; }
  .mcp-eyebrow { display: flex; align-items: center; gap: 7px; color: #25635f; font-size: .76rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .mcp-hero h1 { max-width: 860px; margin-top: 14px; font-size: clamp(2.8rem, 7vw, 5.8rem); line-height: .98; font-weight: 900; letter-spacing: 0; }
  .mcp-lede { max-width: 800px; margin-top: 24px; color: #526176; font-size: 1.18rem; line-height: 1.65; }
  .mcp-endpoint { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; width: fit-content; margin-top: 30px; padding: 12px 16px; border: 1px solid #b8e7d9; border-radius: 7px; background: #eaf8f4; color: #25635f; }
  .mcp-endpoint span { font-size: .76rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .mcp-endpoint code { color: #172033; font-size: .96rem; font-weight: 800; }
  .mcp-section { border-bottom: 1px solid #dce3ea; padding: 58px 0; }
  .mcp-section-heading { max-width: 760px; }
  .mcp-section h2 { margin-top: 10px; font-size: clamp(1.8rem, 4vw, 3rem); line-height: 1.08; font-weight: 900; }
  .mcp-section-heading > p:last-child { margin-top: 16px; color: #526176; line-height: 1.65; }
  .mcp-tool-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 30px; }
  .mcp-tool-card { min-height: 180px; padding: 22px; border: 1px solid #d7e0e8; border-radius: 7px; background: #fff; }
  .mcp-tool-card > svg { color: #25635f; }
  .mcp-tool-card h3 { margin-top: 24px; font-size: 1.08rem; font-weight: 900; }
  .mcp-tool-card p, .mcp-client-card p, .mcp-safety-grid p { margin-top: 10px; color: #526176; line-height: 1.55; }
  .mcp-client-list { display: grid; gap: 16px; margin-top: 30px; }
  .mcp-client-card { display: grid; grid-template-columns: 58px minmax(0, 1fr); gap: 20px; padding: 24px; border: 1px solid #d7e0e8; border-radius: 7px; background: #fff; }
  .mcp-card-number { color: #b85b13; font-size: 1.2rem; font-weight: 900; }
  .mcp-client-card h3 { font-size: 1.25rem; font-weight: 900; }
  .mcp-client-steps { display: grid; gap: 8px; margin: 17px 0 0; padding-left: 22px; color: #526176; line-height: 1.55; }
  .mcp-client-card pre { overflow-x: auto; margin: 16px 0 13px; padding: 15px 17px; border-radius: 5px; background: #172033; color: #e7f2f3; font: .9rem/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: pre-wrap; }
  .mcp-client-card a { display: inline-flex; align-items: center; gap: 5px; }
  .mcp-prompt-list { display: grid; gap: 10px; margin-top: 26px; }
  .mcp-prompt-list code { display: block; padding: 15px 17px; border-left: 3px solid #8bd7c4; background: #fff; color: #334155; font: .92rem/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .mcp-safety-section { border-bottom: 0; }
  .mcp-safety-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 26px; }
  .mcp-safety-grid p { display: flex; gap: 9px; margin-top: 0; padding: 18px; border: 1px solid #d7e0e8; border-radius: 7px; background: #fff; }
  .mcp-safety-grid svg { flex: 0 0 auto; color: #168447; margin-top: 2px; }
  .mcp-doc-links { margin-top: 26px; color: #526176; }
  @media (max-width: 900px) { .mcp-tool-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .mcp-safety-grid { grid-template-columns: 1fr; } }
  @media (max-width: 600px) { .mcp-docs-container { width: min(100% - 28px, 1120px); padding-top: 26px; } .mcp-hero { padding: 52px 0 46px; } .mcp-tool-grid { grid-template-columns: 1fr; } .mcp-client-card { grid-template-columns: 1fr; gap: 8px; } .mcp-section { padding: 44px 0; } }
`

export default McpDocsPage
