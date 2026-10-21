import { useState } from 'react'
import { applyTheme, readTheme, type Theme } from '../theme.ts'
import { tools } from '../tools/registry.tsx'

export function Shell({ current }: { current: string | null }) {
  const [theme, setTheme] = useState<Theme>(readTheme)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return (
    <>
      <a className="skip" href="#tool">
        Skip to tool
      </a>
      <header className="topbar">
        <a className="brand-link" href="#/">
          Toolbox
        </a>
        <button type="button" className="button button--ghost button--small" aria-pressed={theme === 'dark'} onClick={toggleTheme}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </header>
      <nav className="nav" aria-label="Tools">
        <a href="#/" aria-current={current === null ? 'page' : undefined}>
          All tools
        </a>
        {tools.map((tool) => (
          <a key={tool.id} href={`#${tool.path}`} aria-current={current === tool.id ? 'page' : undefined}>
            {tool.short}
          </a>
        ))}
      </nav>
    </>
  )
}
