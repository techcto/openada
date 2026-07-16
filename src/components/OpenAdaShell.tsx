import type { ReactNode } from 'react'
import { BookOpen, Code2, Globe2, Star } from 'lucide-react'

type CurrentPage = 'home' | 'directory' | 'api' | 'docs'

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
            <a className={current === 'api' ? 'global-nav-link current' : 'global-nav-link'} href="/api-reference" aria-current={current === 'api' ? 'page' : undefined}><Code2 size={16} aria-hidden /> Public API</a>
            <a className={current === 'docs' ? 'global-nav-link current' : 'global-nav-link'} href="/docs" aria-current={current === 'docs' ? 'page' : undefined}><BookOpen size={16} aria-hidden /> ADA guidance</a>
          </nav>
        </div>
      </header>
      {children}
      <footer className="global-footer">
        <div className="global-footer-inner">
          <div><strong>OpenADA</strong><span>Open accessibility checks for the web.</span></div>
          <nav aria-label="Footer navigation"><a href="/api-reference">API</a><a href="/directory">Directory</a><a href="/docs">Guidance</a><a href="https://www.ada.gov/" target="_blank" rel="noreferrer">ADA.gov</a></nav>
          <small>Automated results are a starting point, not a legal determination.</small>
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
        .global-footer { border-top: 1px solid #dce3ea; background: #172033; color: #dce7ef; }
        .global-footer-inner { min-height: 150px; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 14px 28px; padding: 28px 0; }
        .global-footer strong, .global-footer span { display: block; }
        .global-footer strong { color: #fff; font-size: 1rem; }
        .global-footer span, .global-footer small { color: #a9b8c7; }
        .global-footer span { margin-top: 6px; font-size: .9rem; }
        .global-footer nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 14px; }
        .global-footer nav a { color: #d7f7ec; font-size: .88rem; font-weight: 800; text-decoration: none; }
        .global-footer nav a:hover, .global-footer nav a:focus-visible { color: #fff; text-decoration: underline; }
        .global-footer small { grid-column: 1 / -1; font-size: .78rem; }
        @media (max-width: 680px) { .global-header-inner, .global-footer-inner { width: min(100% - 36px, 1440px); } .global-header-inner { min-height: 66px; align-items: flex-start; padding: 14px 0; } .global-nav { justify-content: flex-start; } .global-nav-link { min-height: 32px; padding: 0 7px; font-size: .82rem; } .global-footer-inner { grid-template-columns: 1fr; } .global-footer nav { justify-content: flex-start; } }
      `}</style>
    </div>
  )
}
