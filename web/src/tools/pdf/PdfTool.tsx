import { marked } from 'marked'
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { copyText } from '../../copy.ts'

const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

type ConvertResponse = {
  markdown: string
}

export default function PdfTool() {
  const [file, setFile] = useState<File | null>(null)
  const [markdown, setMarkdown] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [view, setView] = useState<'preview' | 'raw'>('preview')
  const fileInput = useRef<HTMLInputElement>(null)
  const copyTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
    }
  }, [])

  const thin = done && markdown.trim().length < 40

  function chooseFile(next: File | null) {
    setFile(next)
    setError('')
    setMarkdown('')
    setCopied(false)
    setDone(false)
    setView('preview')
    if (copyTimer.current !== null) {
      window.clearTimeout(copyTimer.current)
      copyTimer.current = null
    }
  }

  function showCopied() {
    setCopied(true)
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => {
      setCopied(false)
      copyTimer.current = null
    }, 2000)
  }

  function openPicker() {
    fileInput.current?.click()
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setDragging(false)
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const next = event.dataTransfer.files?.[0]
    if (next) chooseFile(next)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      setError('Choose a PDF first.')
      return
    }

    setBusy(true)
    setError('')
    setCopied(false)
    setDone(false)
    setMarkdown('')
    if (copyTimer.current !== null) {
      window.clearTimeout(copyTimer.current)
      copyTimer.current = null
    }

    const body = new FormData()
    body.append('file', file)

    try {
      const response = await fetch(`${apiUrl}/tools/pdf-to-md/convert`, {
        method: 'POST',
        body,
      })
      const payload = (await response.json()) as ConvertResponse & { detail?: string }
      if (!response.ok) {
        const detail = typeof payload.detail === 'string' ? payload.detail : 'Conversion failed.'
        throw new Error(detail)
      }
      setMarkdown(payload.markdown ?? '')
      setDone(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Conversion failed.')
    } finally {
      setBusy(false)
    }
  }

  async function onCopy() {
    const ok = await copyText(markdown)
    if (ok) {
      showCopied()
      return
    }
    setError('Could not copy. Select the Markdown and copy it manually.')
  }

  return (
    <div className={done ? 'workspace' : 'workspace workspace--solo'}>
      <section className="card">
        <p className="step">1</p>
        <h1>PDF to Markdown</h1>
        <p className="lede">
          Upload a digital PDF. It is sent to the converter for this request and is not stored.
          On the free server, the first convert after idle time can take about a minute.
        </p>
        <form onSubmit={onSubmit}>
          <div
            className={dragging ? 'drop drop--over' : 'drop'}
            onClick={openPicker}
            onDragEnter={onDragOver}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <FileIcon />
            <p className="drop-title">Upload your file</p>
            <p className="drop-hint">Drag and drop or click to select</p>
            <button
              className="select"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                openPicker()
              }}
            >
              <UploadIcon />
              Select File
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            />
          </div>
          {file ? <p className="filename">{file.name}</p> : null}
          <button className="convert" type="submit" disabled={!file || busy}>
            {busy ? 'Converting…' : 'Convert'}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>
      {done ? (
        <section className="result" aria-live="polite">
          {markdown.trim().length === 0 || thin ? (
            <p className="notice">
              This PDF has almost no selectable text. Scanned pages are not read in this version.
            </p>
          ) : null}
          <div className="result-bar">
            <p className="result-name">{file?.name ?? 'Markdown'}</p>
            <div className="result-actions">
              <div className="view-toggle" role="group" aria-label="Markdown view">
                <button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}>
                  <EyeIcon />
                  Preview
                </button>
                <button type="button" aria-pressed={view === 'raw'} onClick={() => setView('raw')}>
                  <RawIcon />
                  Raw
                </button>
              </div>
              <div className="copy-slot">
                {copied ? (
                  <p className="copy-msg" role="status">
                    Copied
                  </p>
                ) : null}
                <button
                  className="copy-icon"
                  type="button"
                  aria-label={copied ? 'Copied' : 'Copy markdown'}
                  onClick={onCopy}
                  disabled={!markdown}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>
          </div>
          {view === 'preview' ? (
            <div className="preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />
          ) : (
            <pre>{markdown}</pre>
          )}
        </section>
      ) : null}
    </div>
  )
}

function FileIcon() {
  return (
    <svg className="file-icon" viewBox="0 0 48 56" aria-hidden="true">
      <path
        d="M10 4.5h18.2L40 16.2V48a3.5 3.5 0 0 1-3.5 3.5h-26A3.5 3.5 0 0 1 7 48V8A3.5 3.5 0 0 1 10.5 4.5H10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M28 4.8V14a2.2 2.2 0 0 0 2.2 2.2H39.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const allowedTags = new Set([
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'P',
  'UL',
  'OL',
  'LI',
  'STRONG',
  'EM',
  'CODE',
  'PRE',
  'BLOCKQUOTE',
  'A',
  'TABLE',
  'THEAD',
  'TBODY',
  'TR',
  'TH',
  'TD',
  'BR',
  'HR',
])

function renderMarkdown(source: string) {
  const html = marked.parse(source, { async: false })
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const clean = document.createElement('div')
  for (const child of parsed.body.childNodes) {
    const next = sanitizeNode(child)
    if (next) clean.appendChild(next)
  }
  return clean.innerHTML
}

function sanitizeNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return node.cloneNode()
  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const element = node as HTMLElement
  if (!allowedTags.has(element.tagName)) {
    const fragment = document.createDocumentFragment()
    for (const child of element.childNodes) {
      const next = sanitizeNode(child)
      if (next) fragment.appendChild(next)
    }
    return fragment
  }

  const copy = document.createElement(element.tagName.toLowerCase())
  if (element.tagName === 'A') {
    const href = element.getAttribute('href') ?? ''
    if (/^(https?:|mailto:)/i.test(href)) {
      copy.setAttribute('href', href)
      copy.setAttribute('rel', 'noreferrer')
      copy.setAttribute('target', '_blank')
    }
  }
  for (const child of element.childNodes) {
    const next = sanitizeNode(child)
    if (next) copy.appendChild(next)
  }
  return copy
}

function UploadIcon() {
  return (
    <svg className="upload-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 12.5V3.5M8 3.5 4.5 7M8 3.5 11.5 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 13.5h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1.5 8s2.2-4 6.5-4 6.5 4 6.5 4-2.2 4-6.5 4-6.5-4-6.5-4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="8" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function RawIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4 2.5h5.2L12.5 5.8V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9 2.6V6h3.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="5.2" y="5.2" width="8" height="8" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10.6 5.2V3.7A1.2 1.2 0 0 0 9.4 2.5H3.7A1.2 1.2 0 0 0 2.5 3.7v5.7A1.2 1.2 0 0 0 3.7 10.6H5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 8.2 6.4 11l6.1-6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
