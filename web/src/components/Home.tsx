import { tools } from '../tools/registry.tsx'

export function Home() {
  return (
    <div className="home">
      <div className="home-intro">
        <h1>Tools</h1>
        <p className="lede">
          A small set of utilities. PDF to Markdown uses the converter. The others run on this device, so the
          files never leave it.
        </p>
      </div>
      <div className="tool-grid">
        {tools.map((tool) => (
          <a key={tool.id} className="tool-card" href={`#${tool.path}`}>
            <h2>{tool.name}</h2>
            <p>{tool.summary}</p>
            <span className="pill">{tool.where}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export function NotFound() {
  return (
    <section className="card">
      <h1>No such tool</h1>
      <p className="lede">That link does not match a tool in this toolbox.</p>
      <a className="text-link" href="#/">
        Back to tools
      </a>
    </section>
  )
}
