import { useMemo, useState } from 'react'
import { downloadText } from '../../download.ts'
import { Field } from '../../components/Field.tsx'
import { LocalNote } from '../../components/LocalNote.tsx'
import { useCopy } from '../../components/useCopy.ts'
import {
  csvToJson,
  formatJson,
  jsonToCsv,
  jsonToYaml,
  parseJson,
  sortKeysDeep,
  yamlErrorMessage,
  yamlToJsonValue,
} from './convert.ts'
import { TreeView } from './TreeView.tsx'

type Indent = '2' | '4' | 'tab'

export default function JsonTool() {
  const [source, setSource] = useState('')
  const [indent, setIndent] = useState<Indent>('2')
  const [sort, setSort] = useState(false)
  const [view, setView] = useState<'code' | 'tree'>('code')
  const [output, setOutput] = useState<{ label: string; text: string; filename: string } | null>(null)
  const [actionError, setActionError] = useState('')
  const { copied, copy } = useCopy()

  const parsed = useMemo(() => (source.trim() ? parseJson(source) : null), [source])
  const treeValue = parsed?.ok ? (sort ? sortKeysDeep(parsed.value) : parsed.value) : null

  function indentText() {
    if (indent === 'tab') return '\t'
    if (indent === '4') return '    '
    return '  '
  }

  function format(minify: boolean) {
    if (!source.trim()) {
      setActionError('Paste JSON first.')
      return
    }
    const result = formatJson(source, { indent: indentText(), sort, minify })
    if (!result.ok) {
      setActionError('')
      return
    }
    setSource(result.text)
    setOutput(null)
    setActionError('')
  }

  function requireJson(): { ok: true; value: unknown } | { ok: false } {
    if (!source.trim()) {
      setActionError('Paste JSON first.')
      return { ok: false }
    }
    if (!parsed?.ok) {
      setActionError('Fix the JSON before converting.')
      return { ok: false }
    }
    return { ok: true, value: sort ? sortKeysDeep(parsed.value) : parsed.value }
  }

  function toYaml() {
    const ready = requireJson()
    if (!ready.ok) return
    try {
      setOutput({ label: 'YAML', text: jsonToYaml(ready.value), filename: 'data.yaml' })
      setActionError('')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not convert to YAML.')
    }
  }

  function toCsv() {
    const ready = requireJson()
    if (!ready.ok) return
    try {
      setOutput({ label: 'CSV', text: jsonToCsv(ready.value), filename: 'data.csv' })
      setActionError('')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not convert to CSV.')
    }
  }

  function fromYaml() {
    if (!source.trim()) {
      setActionError('Paste YAML first.')
      return
    }
    try {
      const value = yamlToJsonValue(source)
      const next = sort ? sortKeysDeep(value) : value
      setSource(JSON.stringify(next, null, indentText()))
      setOutput(null)
      setActionError('')
    } catch (error) {
      setActionError(yamlErrorMessage(error))
    }
  }

  function fromCsv() {
    if (!source.trim()) {
      setActionError('Paste CSV first.')
      return
    }
    try {
      setSource(JSON.stringify(csvToJson(source), null, indentText()))
      setOutput(null)
      setActionError('')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not read that CSV.')
    }
  }

  async function onCopy(text: string, id: string) {
    const ok = await copy(text, id)
    if (!ok) setActionError('Could not copy. Select the text and copy it manually.')
  }

  return (
    <section className="card tool-stack">
      <h1>JSON formatter</h1>
      <p className="lede">
        Format, minify, and check JSON. Convert an array of objects to CSV, or move between JSON and YAML.
        CSV cells come back as text. YAML uses the 1.2 core schema, so true and false are booleans and other words stay text.
      </p>
      <LocalNote />
      <div className="options">
        <div className="view-toggle" role="group" aria-label="JSON view">
          <button type="button" aria-pressed={view === 'code'} onClick={() => setView('code')}>
            Code
          </button>
          <button type="button" aria-pressed={view === 'tree'} onClick={() => setView('tree')}>
            Tree
          </button>
        </div>
        <Field label="Indent" htmlFor="json-indent">
          <select id="json-indent" className="control" value={indent} onChange={(event) => setIndent(event.target.value as Indent)}>
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </Field>
        <label className="check">
          <input type="checkbox" checked={sort} onChange={(event) => setSort(event.target.checked)} />
          Sort keys
        </label>
      </div>
      <div className="actions">
        <button type="button" className="button" onClick={() => format(false)}>
          Format
        </button>
        <button type="button" className="button button--ghost" onClick={() => format(true)}>
          Minify
        </button>
        <button type="button" className="button button--ghost" onClick={() => void onCopy(source, 'source')} disabled={!source}>
          {copied === 'source' ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="button button--ghost" onClick={() => downloadText(source, 'data.json', 'application/json')} disabled={!source}>
          Download
        </button>
        <button type="button" className="button button--ghost" onClick={toYaml}>
          To YAML
        </button>
        <button type="button" className="button button--ghost" onClick={toCsv}>
          To CSV
        </button>
        <button type="button" className="button button--ghost" onClick={fromYaml}>
          From YAML
        </button>
        <button type="button" className="button button--ghost" onClick={fromCsv}>
          From CSV
        </button>
      </div>
      <label className="sr-only" htmlFor="json-source">
        JSON, YAML, or CSV
      </label>
      <textarea
        id="json-source"
        className="editor"
        spellCheck={false}
        value={source}
        aria-invalid={Boolean(parsed && !parsed.ok)}
        placeholder="Paste JSON here"
        onChange={(event) => {
          setSource(event.target.value)
          setActionError('')
        }}
      />
      {parsed && !parsed.ok ? (
        <div className="error" role="status">
          <p>
            Line {parsed.error.line}, column {parsed.error.column}: {parsed.error.message}
          </p>
          <pre className="error-line">
            {parsed.error.lineText}
            {'\n'}
            {' '.repeat(Math.max(0, parsed.error.column - 1))}^
          </pre>
        </div>
      ) : null}
      {parsed?.ok ? <p className="ok-note">Valid JSON</p> : null}
      {actionError ? (
        <p className="error" role="alert">
          {actionError}
        </p>
      ) : null}
      {view === 'tree' ? (
        treeValue !== null && source.length <= 400_000 ? (
          <TreeView value={treeValue} />
        ) : (
          <p className="field-hint">
            {source.trim() ? 'The tree view needs valid JSON, and very large documents stay in the editor.' : 'Paste JSON to open the tree.'}
          </p>
        )
      ) : null}
      {output ? (
        <div className="output-block">
          <div className="result-bar">
            <p className="result-name">{output.label}</p>
            <div className="actions">
              <button type="button" className="button button--ghost button--small" onClick={() => void onCopy(output.text, 'output')}>
                {copied === 'output' ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => downloadText(output.text, output.filename, output.filename.endsWith('.csv') ? 'text/csv' : 'application/yaml')}
              >
                Download
              </button>
            </div>
          </div>
          <pre className="source-block">{output.text}</pre>
        </div>
      ) : null}
      <p className="sr-only" role="status">
        {copied ? 'Copied' : ''}
      </p>
    </section>
  )
}
