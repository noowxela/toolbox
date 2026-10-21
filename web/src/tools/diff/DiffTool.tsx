import { useMemo, useState } from 'react'
import { LocalNote } from '../../components/LocalNote.tsx'
import { buildDiff, type DiffGranularity, type DiffRow, type InlinePart } from './diffText.ts'

export default function DiffTool() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const [ignoreCase, setIgnoreCase] = useState(false)
  const [granularity, setGranularity] = useState<DiffGranularity>('word')
  const [view, setView] = useState<'side' | 'inline'>('side')

  const model = useMemo(
    () => buildDiff(left, right, { ignoreWhitespace, ignoreCase, granularity }),
    [left, right, ignoreWhitespace, ignoreCase, granularity],
  )

  function swap() {
    setLeft(right)
    setRight(left)
  }

  return (
    <section className="card tool-stack">
      <h1>Text diff</h1>
      <p className="lede">Compare two texts line by line, with word or character changes inside edited lines.</p>
      <LocalNote />
      <div className="diff-panes">
        <div className="field">
          <label className="field-label" htmlFor="diff-left">
            Original
          </label>
          <textarea id="diff-left" className="editor" value={left} onChange={(event) => setLeft(event.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="diff-right">
            Changed
          </label>
          <textarea id="diff-right" className="editor" value={right} onChange={(event) => setRight(event.target.value)} />
        </div>
      </div>
      <div className="options">
        <div className="view-toggle" role="group" aria-label="Diff view">
          <button type="button" aria-pressed={view === 'side'} onClick={() => setView('side')}>
            Side by side
          </button>
          <button type="button" aria-pressed={view === 'inline'} onClick={() => setView('inline')}>
            Inline
          </button>
        </div>
        <div className="view-toggle" role="group" aria-label="Highlight detail">
          <button type="button" aria-pressed={granularity === 'word'} onClick={() => setGranularity('word')}>
            Words
          </button>
          <button type="button" aria-pressed={granularity === 'char'} onClick={() => setGranularity('char')}>
            Characters
          </button>
        </div>
        <label className="check">
          <input type="checkbox" checked={ignoreWhitespace} onChange={(event) => setIgnoreWhitespace(event.target.checked)} />
          Ignore whitespace
        </label>
        <label className="check">
          <input type="checkbox" checked={ignoreCase} onChange={(event) => setIgnoreCase(event.target.checked)} />
          Ignore case
        </label>
        <button type="button" className="button button--ghost" onClick={swap}>
          Swap
        </button>
      </div>
      <p className="stats">
        <span>
          <strong>{model.added}</strong> added
        </span>
        <span>
          <strong>{model.removed}</strong> removed
        </span>
      </p>
      {!left && !right ? <p className="field-hint">Paste text into both panes.</p> : null}
      {model.truncated ? (
        <p className="error">These texts are too different to highlight here. Try a shorter excerpt.</p>
      ) : null}
      {(left || right) && !model.truncated && model.added === 0 && model.removed === 0 ? (
        <p className="ok-note">No changes.</p>
      ) : null}
      {(left || right) && !model.truncated ? (
        <div className="diff-scroll" role="region" aria-label="Difference">
          {view === 'side' ? <SideBySide rows={model.rows} /> : <Inline rows={model.rows} />}
        </div>
      ) : null}
    </section>
  )
}

function SideBySide({ rows }: { rows: DiffRow[] }) {
  return rows.map((row, index) => (
    <div className="diff-row" key={index}>
      <Cell parts={row.left} number={row.leftNumber} kind={row.type === 'add' ? 'empty' : row.type === 'change' ? 'del' : row.type} />
      <Cell parts={row.right} number={row.rightNumber} kind={row.type === 'del' ? 'empty' : row.type === 'change' ? 'add' : row.type} />
    </div>
  ))
}

function Inline({ rows }: { rows: DiffRow[] }) {
  const lines: { key: string; kind: 'context' | 'add' | 'del'; number: number | null; parts: InlinePart[] }[] = []
  rows.forEach((row, index) => {
    if (row.type === 'context' && row.left) {
      lines.push({ key: `c${index}`, kind: 'context', number: row.leftNumber, parts: row.left })
    } else if (row.type === 'del' && row.left) {
      lines.push({ key: `d${index}`, kind: 'del', number: row.leftNumber, parts: row.left })
    } else if (row.type === 'add' && row.right) {
      lines.push({ key: `a${index}`, kind: 'add', number: row.rightNumber, parts: row.right })
    } else if (row.type === 'change') {
      if (row.left) lines.push({ key: `l${index}`, kind: 'del', number: row.leftNumber, parts: row.left })
      if (row.right) lines.push({ key: `r${index}`, kind: 'add', number: row.rightNumber, parts: row.right })
    }
  })
  return lines.map((line) => (
    <div className="diff-row diff-row--inline" key={line.key}>
      <Cell parts={line.parts} number={line.number} kind={line.kind} />
    </div>
  ))
}

function Cell({
  parts,
  number,
  kind,
}: {
  parts: InlinePart[] | null
  number: number | null
  kind: 'context' | 'add' | 'del' | 'empty' | 'change'
}) {
  if (!parts || kind === 'empty') return <div className="diff-cell diff-cell--empty" />
  const tone = kind === 'add' ? 'add' : kind === 'del' ? 'del' : 'context'
  const sign = tone === 'add' ? '+' : tone === 'del' ? '−' : ' '
  return (
    <div className={`diff-cell diff-cell--${tone}`}>
      <span className="diff-line-no">{number ?? ''}</span>
      <span className={tone === 'context' ? 'diff-sign' : `diff-sign diff-sign--${tone}`}>{sign}</span>
      <span>
        {parts.map((part, index) => (
          <span
            key={index}
            className={part.kind === 'added' ? 'diff-word--add' : part.kind === 'removed' ? 'diff-word--del' : undefined}
          >
            {part.text}
          </span>
        ))}
      </span>
    </div>
  )
}
