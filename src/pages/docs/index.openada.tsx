import Head from 'next/head'
import type { NextPage } from 'next'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Keyboard,
  ListChecks,
  Scale,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react'
import { OpenAdaShell } from '@components/OpenAdaShell'

const DocsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>ADA Web Accessibility Guide for Builders | OpenADA</title>
        <meta name="description" content="A practical, human-readable guide to ADA web accessibility, WCAG 2.1 Level AA, Title II and Title III responsibilities, common barriers, exceptions, and accessibility testing." />
        <meta name="keywords" content="ADA web accessibility, ADA website compliance, WCAG 2.1 AA, Title II web accessibility, Title III website accessibility, accessibility testing" />
        <meta property="og:title" content="ADA Web Accessibility Guide for Builders" />
        <meta property="og:description" content="Understand the official ADA web guidance and turn it into practical accessibility work." />
        <meta property="og:type" content="article" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: 'ADA Web Accessibility Guide for Builders',
          description: 'A human-readable guide to ADA web accessibility, WCAG 2.1 Level AA, and practical testing.',
          publisher: { '@type': 'Organization', name: 'OpenADA' },
        }) }} />
      </Head>

      <OpenAdaShell current="docs">
      <main className="docs-shell">

        <section className="docs-hero" aria-labelledby="docs-title">
          <div className="docs-hero-inner">
            <p className="eyebrow">OpenADA field guide</p>
            <h1 id="docs-title">ADA web accessibility, explained for builders</h1>
            <p className="hero-lede">A practical map from civil-rights obligations to the page structure, content, interaction, and testing decisions that make websites usable by people with disabilities.</p>
            <div className="hero-meta">
              <span><BookOpen size={16} aria-hidden /> Human-readable summary</span>
              <span><Scale size={16} aria-hidden /> Primary sources linked</span>
              <span><SearchCheck size={16} aria-hidden /> Automated checks with manual review</span>
            </div>
          </div>
        </section>

        <div className="docs-layout">
          <aside className="docs-nav" aria-label="On this page">
            <p className="nav-label">On this page</p>
            <a href="#at-a-glance">At a glance</a>
            <a href="#who-is-covered">Who is covered</a>
            <a href="#current-title-ii-rule">The current Title II rule</a>
            <a href="#barriers">Common barriers</a>
            <a href="#build-accessibly">Build accessibly</a>
            <a href="#exceptions">Exceptions, not shortcuts</a>
            <a href="#test-and-improve">Test and improve</a>
            <a href="#openada-workflow">The OpenADA workflow</a>
            <a href="#mcp">AI agents with MCP</a>
            <a href="#law-library">Federal law map</a>
            <a href="#official-sources">Official sources</a>
          </aside>

          <article className="docs-article">
            <section id="at-a-glance" className="docs-section intro-section">
              <div className="section-kicker"><ShieldCheck size={17} aria-hidden /> Start here</div>
              <h2>Accessibility is equal access to the service</h2>
              <p>The ADA is not a checklist of visual preferences. It is a civil-rights law. When a public service or a business moves information, transactions, or communication onto the web, the digital experience can become the doorway to that service. An inaccessible doorway can deny people equal access just as a physical barrier can.</p>
              <p>The most useful engineering question is simple: can people with different disabilities find, understand, navigate, operate, submit, and recover from errors in the same service? OpenADA helps find some technical problems. It does not decide whether an organization has met every legal obligation.</p>
              <div className="notice notice-important"><AlertCircle size={20} aria-hidden /><p>This is educational product documentation, not legal advice. The official guidance and the applicable statute, regulation, court decisions, and agency rule control. Review the primary sources for the current requirements that apply to your organization.</p></div>
            </section>

            <section id="who-is-covered" className="docs-section">
              <div className="section-kicker"><Scale size={17} aria-hidden /> Legal context</div>
              <h2>Who is covered by the ADA web guidance?</h2>
              <div className="two-column">
                <div className="explain-block"><h3>Title II: state and local government</h3><p>Title II covers public entities and their services, programs, and activities. That includes online services such as benefits applications, tax documents, public meetings, school registration, court information, voting information, and transportation services.</p><p>A contractor or vendor delivering a public entity&apos;s web content does not remove the public entity&apos;s responsibility. The service still needs to be accessible.</p></div>
                <div className="explain-block"><h3>Title III: businesses open to the public</h3><p>Title III covers public accommodations such as stores, banks, hotels, hospitals, restaurants, theaters, and sports venues. The ADA requires full and equal enjoyment of their goods, services, facilities, privileges, advantages, and accommodations.</p><p>Websites and online services can be part of that experience. Effective communication may require captions, interpreters, accessible forms, alternate formats, or other aids depending on the situation.</p></div>
              </div>
              <p className="source-note">The Department of Justice explains the Title II and Title III web-accessibility position in its <SourceLink href="https://www.ada.gov/resources/web-guidance/">web guidance</SourceLink>.</p>
            </section>

            <section id="current-title-ii-rule" className="docs-section">
              <div className="section-kicker"><FileCheck2 size={17} aria-hidden /> Current rule</div>
              <h2>What the current Title II web rule adds</h2>
              <p>The 2024 Title II rule gives state and local governments a specific technical baseline for web content and mobile apps: <strong>WCAG 2.1 Level AA</strong>. It applies to content a public entity provides or makes available, including content supplied through an arrangement with another organization.</p>
              <div className="rule-grid">
                <Rule number="01" title="Technical standard">Build and maintain web content and mobile apps to WCAG 2.1 Level AA unless an applicable rule exception applies.</Rule>
                <Rule number="02" title="Equivalent facilitation">An alternative method may be used when it provides equivalent or greater accessibility and usability.</Rule>
                <Rule number="03" title="Communication still matters">An exception from WCAG does not erase duties to provide effective communication, reasonable modifications, and equal opportunity.</Rule>
                <Rule number="04" title="Compliance dates changed">ADA.gov currently lists April 26, 2027 for public entities with populations of 50,000 or more, and April 26, 2028 for smaller public entities and special districts.</Rule>
              </div>
              <div className="notice notice-neutral"><FileCheck2 size={20} aria-hidden /><p>The original ADA.gov web guidance is dated March 18, 2022 and explicitly says it does not reflect the later Title II rule. Use the newer <SourceLink href="https://www.ada.gov/resources/2024-03-08-web-rule/">Title II rule fact sheet</SourceLink> and the full Federal Register rule for public-entity requirements.</p></div>
            </section>

            <section id="barriers" className="docs-section">
              <div className="section-kicker"><AlertCircle size={17} aria-hidden /> Failure patterns</div>
              <h2>Common web accessibility barriers</h2>
              <p>These are not abstract edge cases. They are recurring ways a page can block a person from perceiving information, completing a task, or understanding what went wrong.</p>
              <div className="barrier-list">
                <Barrier title="Missing or vague text alternatives" detail="Images, charts, icons, and controls need text that communicates their purpose. Decorative images should not create noise for assistive technology." />
                <Barrier title="Low contrast and color-only meaning" detail="Text needs sufficient contrast, and color cannot be the only signal for required fields, status, errors, or categories." />
                <Barrier title="Video without accurate captions" detail="Captions should be synchronized, accurate, and identify meaningful speakers or sound when needed to understand the content." />
                <Barrier title="Forms without labels, instructions, or recovery" detail="People need an understandable field name, clear instructions, keyboard access, and an error message that explains how to fix the problem." />
                <Barrier title="Mouse-only interaction" detail="Every meaningful action, menu, dialog, and custom control needs a usable keyboard path and a visible focus indicator." />
                <Barrier title="Missing structure and headings" detail="Semantic headings, landmarks, lists, and table relationships help screen-reader users understand and move through the page." />
                <Barrier title="Blocked zoom or small text" detail="Do not prevent browser zoom. Layouts should remain usable when people increase text size or zoom the page." />
              </div>
            </section>

            <section id="build-accessibly" className="docs-section">
              <div className="section-kicker"><Keyboard size={17} aria-hidden /> Implementation</div>
              <h2>Build accessibility into the page lifecycle</h2>
              <div className="practice-list">
                <Practice number="01" title="Start with semantic HTML" detail="Use real headings, buttons, links, form controls, lists, tables, and landmarks before reaching for custom ARIA. Native elements carry behavior that custom widgets must recreate." />
                <Practice number="02" title="Make every action operable" detail="Test the complete experience with a keyboard. Keep focus visible, preserve logical order, trap focus only when necessary, and return focus after dialogs close." />
                <Practice number="03" title="Name controls and states" detail="A screen reader should be able to identify what a control does, its current value, whether it is required, and whether it is expanded, selected, disabled, or invalid." />
                <Practice number="04" title="Design resilient content" detail="Use meaningful link text, descriptive headings, readable language, adequate spacing, responsive reflow, and text that remains usable at higher zoom." />
                <Practice number="05" title="Make errors recoverable" detail="Identify the invalid field, describe the problem in words, preserve user input where possible, and provide a clear correction path." />
                <Practice number="06" title="Treat media and documents as product work" detail="Caption video, provide transcripts when useful, check PDFs and office documents, and make downloadable content part of the accessibility inventory." />
              </div>
              <p className="source-note">These practices expand on the barriers and examples in the <SourceLink href="https://www.ada.gov/resources/web-guidance/">official ADA.gov web guidance</SourceLink> and should be mapped to the applicable WCAG success criteria.</p>
            </section>

            <section id="exceptions" className="docs-section">
              <div className="section-kicker"><ListChecks size={17} aria-hidden /> Public entities</div>
              <h2>Exceptions are narrow, not a shortcut</h2>
              <p>The Title II rule describes limited exceptions for some public-entity content. An exception is a classification to analyze, not a reason to stop making the service accessible.</p>
              <ul className="plain-list">
                <li><strong>Archived content:</strong> generally only when it was created before the compliance date, kept only for reference or recordkeeping, placed in a special archive area, and unchanged since archiving.</li>
                <li><strong>Preexisting conventional documents:</strong> some older word-processing, presentation, PDF, or spreadsheet files may qualify, but the exception can disappear when the document is updated or used for a current service.</li>
                <li><strong>Independent third-party posts:</strong> content posted by members of the public may qualify, while content posted by a contractor, vendor, or the public entity usually does not.</li>
                <li><strong>Individualized secured documents:</strong> some password-protected documents about a specific person, property, or account may qualify; the surrounding website still needs to be accessible.</li>
                <li><strong>Preexisting social-media posts:</strong> older posts may qualify, but a person who needs the information may still need an accessible way to receive it.</li>
                <li><strong>Fundamental alteration or undue burden:</strong> these are fact-specific limits and do not eliminate the duty to provide effective communication and an equal opportunity.</li>
              </ul>
              <div className="notice notice-important"><AlertCircle size={20} aria-hidden /><p>When an exception does not apply, the content generally needs to meet WCAG 2.1 Level AA. When an exception does apply, the public entity may still need to provide the information in an accessible format to a person who needs it.</p></div>
            </section>

            <section id="test-and-improve" className="docs-section">
              <div className="section-kicker"><SearchCheck size={17} aria-hidden /> Verification</div>
              <h2>Test with automation and people</h2>
              <p>Automated testing is valuable for repeatable signals: missing names, invalid structure, contrast problems, missing alternatives, and other machine-detectable patterns. It is not a legal certification and it cannot understand every user journey.</p>
              <div className="test-grid">
                <div className="test-column"><h3>Automated pass</h3><ul className="check-list"><li><CheckCircle2 size={16} aria-hidden /> Run a representative page or component scan.</li><li><CheckCircle2 size={16} aria-hidden /> Fix critical and serious findings first.</li><li><CheckCircle2 size={16} aria-hidden /> Re-run after content and markup changes.</li><li><CheckCircle2 size={16} aria-hidden /> Keep results with the release or review record.</li></ul></div>
                <div className="test-column"><h3>Human pass</h3><ul className="check-list"><li><CheckCircle2 size={16} aria-hidden /> Complete the main task with only a keyboard.</li><li><CheckCircle2 size={16} aria-hidden /> Check a screen reader or other assistive technology.</li><li><CheckCircle2 size={16} aria-hidden /> Test zoom, text resizing, captions, and reduced motion needs.</li><li><CheckCircle2 size={16} aria-hidden /> Ask people with disabilities to test meaningful journeys.</li></ul></div>
              </div>
              <p className="source-note">ADA.gov specifically cautions that automated checkers and overlays need careful use and that a clean report does not prove full accessibility. Pair automated checks with manual review.</p>
            </section>

            <section id="openada-workflow" className="docs-section workflow-section">
              <div className="section-kicker"><ShieldCheck size={17} aria-hidden /> OpenADA workflow</div>
              <h2>Where OpenADA fits</h2>
              <p>OpenADA combines an axe-core scan with a LanguageTool-compatible language check so teams can put two repeatable review signals next to the content workflow. The service is a testing aid, not a compliance verdict.</p>
              <div className="endpoint-list">
                <Endpoint method="POST" path="/api/v1/check" detail="Run ADA and language checks together for HTML, text, or a public page URL." />
                <Endpoint method="POST" path="/api/v1/ada/check" detail="Run an accessibility scan against submitted HTML." />
                <Endpoint method="POST" path="/api/v1/language/check" detail="Return a compact language issue list for application integrations." />
                <Endpoint method="POST" path="/api/v2/check" detail="Return a LanguageTool-compatible response for CMS provider integrations." />
                <Endpoint method="GET" path="/api/health" detail="Check whether the API container is available." />
              </div>
              <a className="primary-link" href="/"><SearchCheck size={17} aria-hidden /><span>Try the live checker</span></a>
            </section>

            <section id="mcp" className="docs-section workflow-section mcp-section">
              <div className="section-kicker"><Bot size={17} aria-hidden /> OpenADA for AI agents</div>
              <h2>Give your AI coding partner an accessibility archive</h2>
              <p>OpenADA is a remote Model Context Protocol server. Connect an MCP-capable assistant to the live endpoint and ask it to check a public page, start a bounded site scan, follow scan progress, or inspect the public history of a website.</p>
              <div className="notice notice-neutral"><Bot size={20} aria-hidden /><p><strong>One connection, four useful tools.</strong> The same service powers ChatGPT, Codex, Claude, and other MCP clients. Site scans return immediately with a job ID, then the agent polls durable progress while the worker checks pages in the background.</p></div>
              <div className="mcp-grid">
                <div className="mcp-card"><h3>1. ChatGPT</h3><p>Open the Apps or Connectors developer flow available in your ChatGPT workspace, add a remote MCP server, and enter:</p><code className="mcp-code">https://openada.us/mcp</code><p>For a public app submission, use the same URL in the OpenAI Apps submission form. OpenADA is an app-only integration, so it does not require a custom ChatGPT UI to be useful.</p><a className="text-link" href="https://learn.chatgpt.com/docs/submit-plugins" target="_blank" rel="noreferrer">Open the ChatGPT submission guide <ExternalLink size={14} aria-hidden /></a></div>
                <div className="mcp-card"><h3>2. Codex CLI or IDE</h3><p>Add a Streamable HTTP server from the MCP settings in Codex, or add this table to <code>~/.codex/config.toml</code>:</p><pre className="mcp-code-block"><code>{`[mcp_servers.openada]\nurl = "https://openada.us/mcp"\ndefault_tools_approval_mode = "writes"`}</code></pre><p>Run <code>codex mcp list</code>, restart the client, then ask Codex to check a URL. The <code>writes</code> approval mode keeps the queued scan tool visible for confirmation.</p><a className="text-link" href="https://developers.openai.com/codex/mcp" target="_blank" rel="noreferrer">Read the Codex MCP guide <ExternalLink size={14} aria-hidden /></a></div>
                <div className="mcp-card"><h3>3. Claude Code</h3><p>Register the remote server from a project directory:</p><pre className="mcp-code-block"><code>{`claude mcp add --transport http openada https://openada.us/mcp\nclaude mcp list`}</code></pre><p>Then use <code>/mcp</code> inside Claude Code to inspect the connection. If a deployment requires a key, add <code>--header "X-API-Key: $OPENADA_API_KEY"</code>.</p><a className="text-link" href="https://code.claude.com/docs/en/mcp" target="_blank" rel="noreferrer">Read the Claude Code MCP guide <ExternalLink size={14} aria-hidden /></a></div>
                <div className="mcp-card"><h3>4. Inspect locally</h3><p>Run the MCP Inspector to explore the server and call tools before adding it to an agent:</p><pre className="mcp-code-block"><code>{`npx @modelcontextprotocol/inspector`}</code></pre><p>Choose Streamable HTTP and enter <code>http://localhost:3001/mcp</code> for Docker Compose, or the public URL for the deployed service.</p><a className="text-link" href="https://modelcontextprotocol.io/docs/tools/inspector" target="_blank" rel="noreferrer">Open the MCP Inspector docs <ExternalLink size={14} aria-hidden /></a></div>
              </div>
              <h3 className="mcp-prompts-heading">Useful prompts</h3>
              <div className="prompt-list"><code>Check https://example.gov and summarize the most serious accessibility findings.</code><code>Start a 50-page scan for https://example.gov, report progress, and tell me the final grade.</code><code>Show the latest archived scan for www.example.gov and explain what should improve first.</code></div>
              <div className="notice notice-important"><AlertCircle size={20} aria-hidden /><p>OpenADA only fetches public URLs and applies bounded same-host crawling. Results are automated engineering signals, not legal advice, a compliance certification, or a guarantee about litigation risk. Pair every report with manual testing and the requirements that apply to the organization.</p></div>
            </section>

            <section id="law-library" className="docs-section">
              <div className="section-kicker"><Scale size={17} aria-hidden /> Federal law map</div>
              <h2>The disability-rights laws around the web</h2>
              <p>OpenADA focuses on web accessibility testing, but web work can sit inside a wider legal context. This map points to the primary federal sources most often relevant to digital services. It is not a substitute for legal advice, and it does not attempt to summarize every state, local, industry, procurement, or court requirement.</p>
              <div className="source-list">
                <SourceRow title="Americans with Disabilities Act of 1990, as amended" href="https://www.ada.gov/law-and-regs/ada/" detail="The statute covering employment (Title I), public services (Title II), public accommodations and commercial facilities (Title III), telecommunications (Title IV), and miscellaneous provisions (Title V)." />
                <SourceRow title="ADA Title II regulations and web/mobile rule" href="https://www.ada.gov/law-and-regs/regulations/title-ii-2010-regulations/" detail="The enforceable public-entity regulations, including the web and mobile accessibility requirements and WCAG 2.1 Level AA baseline." />
                <SourceRow title="ADA Title III regulations" href="https://www.ada.gov/law-and-regs/regulations/title-iii-regulations/" detail="The regulations for businesses and nonprofit organizations that are public accommodations, including effective communication and auxiliary aids and services." />
                <SourceRow title="Rehabilitation Act Section 504" href="https://www.justice.gov/crt/what-can-doj-do" detail="Prohibits disability discrimination in programs or activities receiving federal financial assistance; the responsible agency and program facts matter." />
                <SourceRow title="Rehabilitation Act Section 508" href="https://www.access-board.gov/ict/" detail="Accessibility requirements for information and communication technology developed, procured, maintained, or used by covered federal agencies." />
                <SourceRow title="Communications Act Sections 255 and 251(a)(2)" href="https://www.access-board.gov/ict/about/" detail="Accessibility requirements and guidelines for covered telecommunications equipment and services, administered with FCC responsibilities." />
                <SourceRow title="Fair Housing Act disability provisions" href="https://www.ada.gov/resources/disability-rights-guide/" detail="Housing discrimination protections, reasonable accommodations and modifications, and accessibility obligations for covered housing." />
                <SourceRow title="Other disability-rights laws and agencies" href="https://www.ada.gov/resources/disability-rights-guide/" detail="ADA.gov’s federal guide also covers education, air travel, voting, institutional settings, and other rights with the agencies responsible for them." />
              </div>
              <div className="notice notice-important"><AlertCircle size={20} aria-hidden /><p>Use the linked statute, regulation, Federal Register rule, and agency material for decisions. OpenADA’s score is evidence for a review process, never a certification that a site complies with every applicable law.</p></div>
            </section>

            <section id="official-sources" className="docs-section sources-section">
              <div className="section-kicker"><BookOpen size={17} aria-hidden /> Keep reading</div>
              <h2>Official sources and standards</h2>
              <p>Laws, regulations, agency guidance, and technical standards change on different schedules. Use these primary sources to verify the requirements for your organization and jurisdiction.</p>
              <div className="source-list">
                <SourceRow title="ADA.gov: Guidance on Web Accessibility and the ADA" href="https://www.ada.gov/resources/web-guidance/" detail="General DOJ guidance for state and local governments and businesses open to the public." />
                <SourceRow title="ADA.gov: Title II web and mobile app rule fact sheet" href="https://www.ada.gov/resources/2024-03-08-web-rule/" detail="Plain-language summary of WCAG 2.1 AA, exceptions, equivalent facilitation, and current compliance dates." />
                <SourceRow title="ADA.gov: Law, Regulations & Standards" href="https://www.ada.gov/law-and-regs/" detail="Official ADA statutes, regulations, standards, and guidance index." />
                <SourceRow title="ADA.gov: Americans with Disabilities Act, as amended" href="https://www.ada.gov/law-and-regs/ada/" detail="Primary text of the ADA with the original title structure and U.S. Code references." />
                <SourceRow title="ADA.gov: Guide to Disability Rights Laws" href="https://www.ada.gov/resources/disability-rights-guide/" detail="Federal disability-rights overview with responsible agencies and complaint information." />
                <SourceRow title="ADA.gov: current Title II small-entity compliance guide" href="https://www.ada.gov/resources/small-entity-compliance-guide/" detail="Current DOJ explanation of WCAG 2.1 Level AA, exceptions, and updated public-entity compliance dates." />
                <SourceRow title="W3C Web Content Accessibility Guidelines" href="https://www.w3.org/WAI/standards-guidelines/wcag/" detail="The technical accessibility guidance referenced by the Title II rule." />
                <SourceRow title="U.S. Access Board Section 508 standards" href="https://www.access-board.gov/ict/" detail="Federal information and communication technology accessibility standards." />
              </div>
              <p className="last-updated">OpenADA documentation summarizes official sources and should be reviewed when those sources change.</p>
            </section>
          </article>
        </div>
      </main>
      </OpenAdaShell>

      <style jsx global>{`
        .docs-shell { min-height: 100vh; background: #f6f8fb; color: #172033; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .docs-header { border-bottom: 1px solid #dce3ea; background: #ffffff; }
        .docs-header-inner, .docs-hero-inner, .docs-layout { width: min(1240px, calc(100% - 40px)); margin: 0 auto; }
        .docs-header-inner { min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .back-link, .source-button, .primary-link { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; font-weight: 800; }
        .back-link { color: #25635f; }
        .source-button, .primary-link { min-height: 38px; border-radius: 6px; padding: 0 12px; }
        .source-button { border: 1px solid #c8d7d3; color: #25635f; background: #ffffff; }
        .source-button:hover, .source-button:focus-visible, .primary-link:hover, .primary-link:focus-visible { border-color: #25635f; background: #f0f8f6; }
        .docs-hero { border-bottom: 1px solid #dce3ea; background: #eaf3f1; }
        .docs-hero-inner { padding: 72px 0 64px; }
        .eyebrow, .section-kicker, .nav-label { color: #25635f; font-size: 0.76rem; font-weight: 850; letter-spacing: 0.08em; text-transform: uppercase; }
        .eyebrow { margin: 0 0 14px; }
        h1, h2, h3, p { margin: 0; }
        h1 { max-width: 820px; font-size: clamp(2.2rem, 5vw, 4.4rem); line-height: 1.02; letter-spacing: 0; font-weight: 900; }
        .hero-lede { max-width: 760px; margin-top: 22px; color: #405168; font-size: 1.18rem; line-height: 1.65; }
        .hero-meta { display: flex; flex-wrap: wrap; gap: 10px 20px; margin-top: 28px; color: #25635f; font-size: 0.88rem; font-weight: 800; }
        .hero-meta span { display: inline-flex; align-items: center; gap: 7px; }
        .docs-layout { display: grid; grid-template-columns: 220px minmax(0, 820px); justify-content: space-between; gap: 64px; padding: 54px 0 90px; }
        .docs-nav { position: sticky; top: 22px; align-self: start; display: grid; gap: 4px; }
        .nav-label { margin-bottom: 10px; }
        .docs-nav a { border-left: 2px solid transparent; padding: 7px 0 7px 12px; color: #64748b; font-size: 0.9rem; line-height: 1.35; text-decoration: none; }
        .docs-nav a:hover, .docs-nav a:focus-visible { border-color: #25635f; color: #172033; }
        .docs-article { min-width: 0; }
        .docs-section { padding: 0 0 58px; margin: 0 0 58px; border-bottom: 1px solid #dce3ea; scroll-margin-top: 24px; }
        .docs-section:last-child { margin-bottom: 0; border-bottom: 0; }
        .section-kicker { display: inline-flex; align-items: center; gap: 7px; margin-bottom: 12px; }
        h2 { max-width: 760px; font-size: 2rem; line-height: 1.14; font-weight: 900; }
        h3 { font-size: 1.02rem; line-height: 1.25; font-weight: 850; }
        .docs-section > p, .explain-block p, .source-note, .last-updated { color: #526176; font-size: 1rem; line-height: 1.72; }
        .docs-section > p { max-width: 760px; margin-top: 18px; }
        .docs-section strong { color: #172033; }
        .docs-section a:not(.back-link):not(.source-button):not(.primary-link) { color: #25635f; font-weight: 800; }
        .notice { display: flex; align-items: flex-start; gap: 12px; max-width: 780px; margin-top: 24px; border-left: 4px solid #25635f; padding: 15px 18px; color: #405168; line-height: 1.6; }
        .notice p { margin: 0; }
        .notice-important { border-color: #b45309; background: #fff8eb; }
        .notice-neutral { background: #eef2f7; }
        .two-column, .rule-grid, .test-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 28px; }
        .explain-block, .test-column { border-top: 3px solid #c8d7d3; padding-top: 15px; }
        .explain-block p { margin-top: 12px; }
        .source-note { margin-top: 22px !important; font-size: 0.9rem !important; }
        .rule-item { display: grid; grid-template-columns: 42px 1fr; gap: 12px; border: 1px solid #dce3ea; border-radius: 8px; padding: 16px; background: #ffffff; }
        .rule-number, .practice-number { color: #25635f; font-size: 0.82rem; font-weight: 900; }
        .rule-item p { margin-top: 7px; color: #526176; line-height: 1.55; }
        .barrier-list, .practice-list, .endpoint-list, .source-list { display: grid; gap: 0; margin-top: 26px; border-top: 1px solid #dce3ea; }
        .barrier-item, .practice-item, .endpoint-row, .source-row { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 18px; padding: 17px 0; border-bottom: 1px solid #dce3ea; }
        .barrier-item p, .practice-item p, .endpoint-row p, .source-row p { color: #526176; line-height: 1.55; }
        .practice-title { margin-top: 5px; font-weight: 850; }
        .plain-list { display: grid; gap: 14px; max-width: 780px; margin: 24px 0 0; padding-left: 21px; color: #526176; line-height: 1.65; }
        .plain-list strong { color: #172033; }
        .check-list { display: grid; gap: 12px; margin: 18px 0 0; padding: 0; list-style: none; color: #526176; line-height: 1.5; }
        .check-list li { display: flex; align-items: flex-start; gap: 8px; }
        .check-list svg { flex: 0 0 auto; margin-top: 3px; color: #15803d; }
        .endpoint-method { color: #25635f; font-size: 0.78rem; font-weight: 900; letter-spacing: 0.06em; }
        .endpoint-path { display: block; margin-top: 6px; color: #172033; font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 0.88rem; overflow-wrap: anywhere; }
        .primary-link { margin-top: 24px; border: 1px solid #25635f; background: #25635f; color: #ffffff; }
        .primary-link:hover, .primary-link:focus-visible { color: #25635f; }
        .mcp-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 28px; }
        .mcp-card { display: grid; align-content: start; gap: 12px; border: 1px solid #dce3ea; border-radius: 8px; padding: 18px; background: #ffffff; }
        .mcp-card p { color: #526176; line-height: 1.58; }
        .mcp-card code, .mcp-code { overflow-wrap: anywhere; }
        .mcp-code { display: block; padding: 10px 12px; border: 1px solid #c8d7d3; border-radius: 5px; background: #f0f8f6; color: #172033; font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: .85rem; }
        .mcp-code-block { margin: 0; overflow-x: auto; border-radius: 6px; padding: 13px; background: #172033; color: #d7f7ec; font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: .78rem; line-height: 1.55; }
        .text-link { display: inline-flex; align-items: center; gap: 6px; color: #25635f; font-size: .86rem; font-weight: 850; text-decoration: none; }
        .text-link:hover, .text-link:focus-visible { text-decoration: underline; }
        .mcp-prompts-heading { margin-top: 30px; }
        .prompt-list { display: grid; gap: 8px; margin-top: 14px; }
        .prompt-list code { display: block; border-left: 3px solid #b8e7d9; padding: 10px 12px; background: #eef2f7; color: #405168; font-size: .86rem; line-height: 1.5; }
        .source-row { grid-template-columns: minmax(0, 1fr) auto; gap: 20px; }
        .source-row a { display: inline-flex; align-items: center; gap: 7px; font-weight: 850; text-decoration: none; }
        .source-row p { margin-top: 6px; font-size: 0.92rem; }
        .source-row > svg { margin-top: 4px; color: #64748b; }
        .last-updated { margin-top: 22px !important; font-size: 0.88rem !important; }
        @media (max-width: 900px) {
          .docs-layout { display: block; padding-top: 32px; }
          .docs-nav { position: static; display: flex; flex-wrap: wrap; gap: 4px 14px; margin-bottom: 38px; }
          .nav-label { flex-basis: 100%; }
          .docs-nav a { border-left: 0; border-bottom: 2px solid transparent; padding: 5px 0; }
          .docs-nav a:hover, .docs-nav a:focus-visible { border-color: #25635f; }
        }
        @media (max-width: 680px) {
          .docs-header-inner, .docs-hero-inner, .docs-layout { width: min(100% - 28px, 1240px); }
          .docs-header-inner { min-height: 58px; }
          .source-button span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
          .docs-hero-inner { padding: 48px 0 42px; }
          .hero-lede { font-size: 1rem; }
          .two-column, .rule-grid, .test-grid { grid-template-columns: 1fr; }
          .mcp-grid { grid-template-columns: 1fr; }
          .barrier-item, .practice-item, .endpoint-row, .source-row { grid-template-columns: 1fr; gap: 7px; }
          .source-row > svg { display: none; }
          h2 { font-size: 1.7rem; }
        }
      `}</style>
    </>
  )
}

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}</a>
}

function Rule({ number, title, children }: { number: string; title: string; children: string }) {
  return <div className="rule-item"><span className="rule-number">{number}</span><div><h3>{title}</h3><p>{children}</p></div></div>
}

function Barrier({ title, detail }: { title: string; detail: string }) {
  return <div className="barrier-item"><h3>{title}</h3><p>{detail}</p></div>
}

function Practice({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="practice-item"><span className="practice-number">{number}</span><div><h3 className="practice-title">{title}</h3><p>{detail}</p></div></div>
}

function Endpoint({ method, path, detail }: { method: string; path: string; detail: string }) {
  return <div className="endpoint-row"><div><span className="endpoint-method">{method}</span><code className="endpoint-path">{path}</code></div><p>{detail}</p></div>
}

function SourceRow({ title, href, detail }: { title: string; href: string; detail: string }) {
  return <div className="source-row"><div><a href={href} target="_blank" rel="noreferrer"><span>{title}</span><ExternalLink size={14} aria-hidden /></a><p>{detail}</p></div><ExternalLink size={16} aria-hidden /></div>
}

export default DocsPage
