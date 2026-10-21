import { Suspense, useEffect, useState } from 'react'
import { Home, NotFound } from './components/Home.tsx'
import { Shell } from './components/Shell.tsx'
import { hashToPath } from './router.ts'
import { toolByPath } from './tools/registry.tsx'

function useHashPath() {
  const [path, setPath] = useState(() => hashToPath(window.location.hash))
  useEffect(() => {
    const onChange = () => setPath(hashToPath(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return path
}

export default function App() {
  const path = useHashPath()
  const tool = path === '/' ? undefined : toolByPath(path)

  useEffect(() => {
    document.title = tool ? `${tool.name} · Toolbox` : 'Toolbox'
    window.scrollTo(0, 0)
  }, [path, tool])

  let body
  if (path === '/') body = <Home />
  else if (tool) {
    const Page = tool.Component
    body = (
      <Suspense fallback={<p className="loading">Loading…</p>}>
        <Page />
      </Suspense>
    )
  } else body = <NotFound />

  return (
    <main className="page">
      <div className="shell">
        <Shell current={path === '/' ? null : (tool?.id ?? '')} />
        <div id="tool" tabIndex={-1}>
          {body}
        </div>
      </div>
    </main>
  )
}
