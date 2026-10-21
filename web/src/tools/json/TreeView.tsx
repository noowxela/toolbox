import { useState } from 'react'
import { isRecord } from './convert.ts'

const branchLimit = 500

export function TreeView({ value }: { value: unknown }) {
  return (
    <div className="tree">
      <TreeNode value={value} depth={0} />
    </div>
  )
}

function TreeNode({ name, value, depth }: { name?: string; value: unknown; depth: number }) {
  if (Array.isArray(value) || isRecord(value)) {
    return <TreeBranch name={name} value={value} depth={depth} />
  }
  return (
    <div className="tree-row">
      {name !== undefined ? <span className="tree-key">{name}: </span> : null}
      <span className="tree-leaf">{leafText(value)}</span>
    </div>
  )
}

function TreeBranch({
  name,
  value,
  depth,
}: {
  name?: string
  value: unknown[] | Record<string, unknown>
  depth: number
}) {
  const [open, setOpen] = useState(depth < 2)
  const entries = Array.isArray(value)
    ? value.slice(0, branchLimit).map((item, index) => [String(index), item] as const)
    : Object.entries(value).slice(0, branchLimit)
  const total = Array.isArray(value) ? value.length : Object.keys(value).length
  const hidden = total - entries.length
  const summary = Array.isArray(value) ? `[${value.length}]` : `{${Object.keys(value).length}}`

  return (
    <div className="tree-branch">
      <button type="button" className="tree-toggle" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        {name !== undefined ? <span className="tree-key">{name}</span> : null}
        <span className="tree-meta">{summary}</span>
      </button>
      {open ? (
        <ul>
          {entries.map(([key, child]) => (
            <li key={key}>
              <TreeNode name={key} value={child} depth={depth + 1} />
            </li>
          ))}
          {hidden > 0 ? <li className="tree-meta">{hidden} more</li> : null}
        </ul>
      ) : null}
    </div>
  )
}

function leafText(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value)
  if (value === null) return 'null'
  if (typeof value === 'undefined') return ''
  return String(value)
}
