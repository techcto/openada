import type { ReactNode } from 'react'
import { BookOpen, Bot, Code2, ExternalLink, Globe2, Github, Star } from 'lucide-react'

type CurrentPage = 'home' | 'directory' | 'api' | 'docs' | 'mcp' | 'support' | 'scan' | 'report'

export function OpenAdaShell({ children, current }: { children: ReactNode; current: CurrentPage }) {
  return (
    <div className="openada-site">
      <header className="global-header">
        <div className="global-header-inner">
          <a className="global-brand" href="/" aria-label="OpenADA home">
            <span className="global-brand-mark"><Star size={20} fill="currentColor" aria-hidden /></span>
            <span className="global-brand-name">OpenADA</span>
          </a>
          <nav className="global-nav" aria-label="Primary navigation">
            <a className={current === 'directory' ? 'global-nav-link current' : 'global-nav-link'} href="/directory" aria-current={current === 'directory' ? 'page' : undefined}><Globe2 size={16} aria-hidden /> Directory</a>
            <a className={current === 'docs' ? 'global-nav-link current' : 'global-nav-link'} href="/docs" aria-current={current === 'docs' ? 'page' : undefined}><BookOpen size={16} aria-hidden /> ADA guidance</a>
            <a className={current === 'api' ? 'global-nav-link current' : 'global-nav-link'} href="/api-reference" aria-current={current === 'api' ? 'page' : undefined}><Code2 size={16} aria-hidden /> Public API</a>
            <a className={current === 'mcp' ? 'global-nav-link current' : 'global-nav-link'} href="/docs/mcp" aria-current={current === 'mcp' ? 'page' : undefined}><Bot size={16} aria-hidden /> MCP</a>
            <a className="global-nav-link" href="https://github.com/techcto/openada" target="_blank" rel="noreferrer"><Github size={16} aria-hidden /> GitHub</a>
          </nav>
        </div>
      </header>
      {children}
      <footer className="global-footer">
        <div className="global-footer-inner">
          <div className="footer-intro"><a className="footer-brand" href="/"><span className="footer-brand-mark"><Star size={16} fill="currentColor" aria-hidden /></span><strong>OpenADA</strong></a><p>Open accessibility and language checks for the public web.</p><small>Automated results are a starting point, not a legal determination.</small></div>
          <div className="footer-link-grid">
            <div><strong className="footer-heading">Explore</strong><a href="/">Checker</a><a href="/directory">Directory</a><a href="/scan">Site scans</a></div>
            <div><strong className="footer-heading">Build</strong><a href="/api-reference">Public API</a><a href="/api/openapi">OpenAPI JSON</a><a href="/docs">ADA guidance</a></div>
            <div><strong className="footer-heading">Standards</strong><a href="https://www.ada.gov/law-and-regs/" target="_blank" rel="noreferrer">ADA.gov <ExternalLink size={12} aria-hidden /></a><a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noreferrer">WCAG <ExternalLink size={12} aria-hidden /></a><a href="/support">Support</a><a href="/docs/privacy">Privacy</a><a href="/docs/terms">Terms</a><a href="https://github.com/techcto/openada" target="_blank" rel="noreferrer"><Github size={13} aria-hidden /> Source <ExternalLink size={12} aria-hidden /></a></div>
          </div>
        </div>
      </footer>
      <style jsx global>{`
        .global-header { border-bottom: 1px solid #dce3ea; background: rgba(255, 255, 255, .92); }
        .global-header-inner, .global-footer-inner { width: min(1440px, calc(100% - 56px)); margin: 0 auto; }
        .global-header-inner { min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .global-brand { display: inline-flex; align-items: center; gap: 10px; color: #172033; text-decoration: none; }
        .global-brand-mark { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 2px solid #172033; border-radius: 11px 11px 11px 4px; background: #b8e7d9; color: #172033; box-shadow: 4px 4px 0 #172033; }
        .global-brand-name { font-size: 1.05rem; font-weight: 900; }
        .global-nav { display: flex; align-items: center; justify-content: flex-end; gap: 7px; flex-wrap: wrap; }
        .global-nav-link { min-height: 38px; display: inline-flex; align-items: center; gap: 7px; border: 1px solid transparent; border-radius: 6px; color: #334155; padding: 0 11px; font-size: .9rem; font-weight: 800; text-decoration: none; }
        .global-nav-link:hover, .global-nav-link:focus-visible, .global-nav-link.current { border-color: #c8d7d3; background: #f0f8f6; color: #25635f; }
        .global-footer { border-top: 1px solid #2d3a50; background: #172033; color: #dce7ef; }
        .global-footer-inner { display: grid; grid-template-columns: minmax(220px, .9fr) minmax(0, 1.6fr); gap: 34px; padding: 34px 0 28px; }
        .footer-intro { display: grid; align-content: start; gap: 9px; }
        .footer-brand { display: inline-flex; align-items: center; gap: 9px; width: fit-content; color: #fff; text-decoration: none; }
        .footer-brand-mark { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #b8e7d9; border-radius: 8px 8px 8px 3px; background: #b8e7d9; color: #172033; }
        .footer-brand strong { font-size: 1rem; }
        .footer-intro p { max-width: 250px; color: #a9b8c7; font-size: .88rem; line-height: 1.5; }
        .footer-intro small { color: #8393a6; font-size: .76rem; line-height: 1.45; }
        .footer-link-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
        .footer-link-grid > div { display: grid; align-content: start; justify-items: start; gap: 9px; }
        .footer-heading { color: #b8e7d9; font-size: .76rem; letter-spacing: .08em; text-transform: uppercase; }
        .footer-link-grid a { display: inline-flex; align-items: center; gap: 5px; color: #d7f7ec; font-size: .86rem; font-weight: 750; text-decoration: none; }
        .footer-link-grid a:hover, .footer-link-grid a:focus-visible { color: #fff; text-decoration: underline; }
        @media (max-width: 680px) { .global-header-inner, .global-footer-inner { width: min(100% - 36px, 1440px); } .global-header-inner { min-height: 66px; align-items: flex-start; padding: 14px 0; } .global-nav { justify-content: flex-start; } .global-nav-link { min-height: 32px; padding: 0 7px; font-size: .82rem; } .global-footer-inner { grid-template-columns: 1fr; gap: 26px; } .footer-link-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
    </div>
  )
}
