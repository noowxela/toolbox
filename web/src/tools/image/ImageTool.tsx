import { useEffect, useRef, useState, type DragEvent } from 'react'
import { downloadBlob } from '../../download.ts'
import { Field } from '../../components/Field.tsx'
import { LocalNote } from '../../components/LocalNote.tsx'
import { transcodeImage, zipFiles } from './compress.ts'
import {
  formatBytes,
  savingsLabel,
  type ImageFormat,
  type ResizeOptions,
} from './resize.ts'

type SourceFile = { id: string; file: File }

type DoneResult = {
  status: 'done'
  token: string
  blob: Blob
  width: number
  height: number
  name: string
}

type StoredResult =
  | { status: 'error'; token: string; message: string }
  | DoneResult

type Result = { status: 'working' } | StoredResult

function Thumb({ blob }: { blob: Blob }) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const image = ref.current
    if (!image) return
    const url = URL.createObjectURL(blob)
    image.src = url
    return () => {
      URL.revokeObjectURL(url)
      image.src = ''
    }
  }, [blob])
  return <img ref={ref} className="thumb" alt="" />
}

export default function ImageTool() {
  const [files, setFiles] = useState<SourceFile[]>([])
  const [results, setResults] = useState<Record<string, StoredResult>>({})
  const [format, setFormat] = useState<ImageFormat>('webp')
  const [quality, setQuality] = useState(0.8)
  const [mode, setMode] = useState<'max' | 'percent'>('max')
  const [maxWidth, setMaxWidth] = useState('')
  const [maxHeight, setMaxHeight] = useState('')
  const [percent, setPercent] = useState(100)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const token = `${format}|${quality}|${mode}|${maxWidth}|${maxHeight}|${percent}`

  useEffect(() => {
    const resize: ResizeOptions =
      mode === 'percent'
        ? { mode: 'percent', percent }
        : {
            mode: 'max',
            maxWidth: maxWidth.trim() ? Number(maxWidth) : null,
            maxHeight: maxHeight.trim() ? Number(maxHeight) : null,
          }
    const tokenAtRun = token
    let cancelled = false

    async function run() {
      for (const item of files) {
        if (cancelled) return
        try {
          const encoded = await transcodeImage(item.file, { format, quality, resize })
          if (cancelled) return
          setResults((current) => ({
            ...current,
            [item.id]: {
              status: 'done',
              token: tokenAtRun,
              blob: encoded.blob,
              width: encoded.width,
              height: encoded.height,
              name: encoded.name,
            },
          }))
        } catch (reason) {
          if (cancelled) return
          setResults((current) => ({
            ...current,
            [item.id]: {
              status: 'error',
              token: tokenAtRun,
              message: reason instanceof Error ? reason.message : 'Could not convert that image.',
            },
          }))
        }
      }
    }

    if (files.length > 0) void run()
    return () => {
      cancelled = true
    }
  }, [files, format, quality, mode, maxWidth, maxHeight, percent, token])

  function visibleResult(id: string): Result {
    const stored = results[id]
    if (!stored || stored.token !== token) return { status: 'working' }
    return stored
  }

  function addFiles(list: FileList | File[]) {
    const next = Array.from(list).filter(
      (file) => file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name),
    )
    if (next.length === 0) {
      setError('Choose image files: JPG, PNG, WebP, GIF, or BMP.')
      return
    }
    setError('')
    setFiles((current) => [
      ...current,
      ...next.map((file) => ({ id: crypto.randomUUID(), file })),
    ])
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
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files)
  }

  async function downloadAll() {
    const packed: { name: string; data: Uint8Array }[] = []
    for (const item of files) {
      const result = visibleResult(item.id)
      if (result.status !== 'done') continue
      packed.push({ name: result.name, data: new Uint8Array(await result.blob.arrayBuffer()) })
    }
    if (packed.length === 0) return
    downloadBlob(zipFiles(packed), 'images.zip')
  }

  const doneCount = files.filter((item) => visibleResult(item.id).status === 'done').length

  return (
    <div className={files.length > 0 ? 'tool-layout' : 'tool-layout tool-layout--solo'}>
      <section className="card">
        <h1>Image compress & convert</h1>
        <p className="lede">
          Convert JPG, PNG, and WebP, then resize. Animated GIFs become a single frame. Re-encoding
          strips metadata such as location and camera details.
        </p>
        <LocalNote />
        <div
          className={dragging ? 'drop drop--over' : 'drop'}
          onDragEnter={onDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <p className="drop-title">Drop images</p>
          <p className="drop-hint">Drag and drop or choose files. You can add more than one.</p>
          <label className="select">
            Choose images
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp"
              multiple
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </label>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <Field label="Format" htmlFor="image-format">
          <select
            id="image-format"
            className="control"
            value={format}
            onChange={(event) => setFormat(event.target.value as ImageFormat)}
          >
            <option value="webp">WebP</option>
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
          </select>
        </Field>
        <Field
          label="Quality"
          htmlFor="image-quality"
          hint={format === 'png' ? 'PNG is lossless, so this slider waits for JPG or WebP.' : undefined}
        >
          <div className="slider-row">
            <input
              id="image-quality"
              type="range"
              min={0.1}
              max={1}
              step={0.01}
              value={quality}
              disabled={format === 'png'}
              onChange={(event) => setQuality(Number(event.target.value))}
            />
            <span className="slider-value">{Math.round(quality * 100)}%</span>
          </div>
        </Field>
        <fieldset className="fieldset">
          <legend>Resize</legend>
          <div className="view-toggle" role="group" aria-label="Resize mode">
            <button type="button" aria-pressed={mode === 'max'} onClick={() => setMode('max')}>
              Max width and height
            </button>
            <button type="button" aria-pressed={mode === 'percent'} onClick={() => setMode('percent')}>
              Percent
            </button>
          </div>
          {mode === 'max' ? (
            <div className="field-grid">
              <Field label="Max width" htmlFor="image-width" hint="Leave blank to keep the width.">
                <input
                  id="image-width"
                  className="control"
                  inputMode="numeric"
                  value={maxWidth}
                  onChange={(event) => setMaxWidth(event.target.value.replace(/[^\d]/g, ''))}
                />
              </Field>
              <Field label="Max height" htmlFor="image-height" hint="Leave blank to keep the height.">
                <input
                  id="image-height"
                  className="control"
                  inputMode="numeric"
                  value={maxHeight}
                  onChange={(event) => setMaxHeight(event.target.value.replace(/[^\d]/g, ''))}
                />
              </Field>
            </div>
          ) : (
            <Field label="Scale" htmlFor="image-percent">
              <div className="slider-row">
                <input
                  id="image-percent"
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={percent}
                  onChange={(event) => setPercent(Number(event.target.value))}
                />
                <span className="slider-value">{percent}%</span>
              </div>
            </Field>
          )}
          <p className="field-hint">The aspect ratio stays. Images are not enlarged.</p>
        </fieldset>
        <div className="actions">
          <button type="button" className="button" onClick={() => void downloadAll()} disabled={doneCount === 0}>
            Download zip
          </button>
          {files.length > 0 ? (
            <button type="button" className="button button--ghost" onClick={() => setFiles([])}>
              Clear
            </button>
          ) : null}
        </div>
      </section>
      {files.length > 0 ? (
        <section className="card" aria-live="polite">
          <h2 className="section-title">Files</h2>
          <ul className="file-list">
            {files.map((item) => (
              <ImageRow
                key={item.id}
                item={item}
                result={visibleResult(item.id)}
                onRemove={() => setFiles((current) => current.filter((entry) => entry.id !== item.id))}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function ImageRow({
  item,
  result,
  onRemove,
}: {
  item: SourceFile
  result: Result | undefined
  onRemove: () => void
}) {
  const done = result?.status === 'done' ? result : undefined
  return (
    <li className="file-row">
      {done ? <Thumb blob={done.blob} /> : <span className="thumb thumb--empty" />}
      <div>
        <p className="result-name">{done?.name ?? item.file.name}</p>
        {result?.status === 'working' ? <p className="field-hint">Working…</p> : null}
        {result?.status === 'error' ? <p className="error">{result.message}</p> : null}
        {done ? (
          <p className="file-meta">
            {formatBytes(item.file.size)} → {formatBytes(done.blob.size)} · {savingsLabel(item.file.size, done.blob.size)} ·{' '}
            {done.width}×{done.height}
          </p>
        ) : null}
        <div className="actions">
          <button
            type="button"
            className="button button--ghost button--small"
            disabled={!done}
            onClick={() => {
              if (done) downloadBlob(done.blob, done.name)
            }}
          >
            Download
          </button>
          <button type="button" className="button button--ghost button--small" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    </li>
  )
}
