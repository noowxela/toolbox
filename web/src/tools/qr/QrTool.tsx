import { useEffect, useMemo, useRef, useState } from 'react'
import { downloadBlob, downloadText } from '../../download.ts'
import { Field } from '../../components/Field.tsx'
import { LocalNote } from '../../components/LocalNote.tsx'
import {
  buildQrPayload,
  effectiveErrorCorrection,
  type EcLevel,
  type WifiEncryption,
} from './payload.ts'
import { paintQr, qrError } from './renderQr.ts'

const levels: { id: EcLevel; label: string }[] = [
  { id: 'L', label: 'L (about 7%)' },
  { id: 'M', label: 'M (about 15%)' },
  { id: 'Q', label: 'Q (about 25%)' },
  { id: 'H', label: 'H (about 30%)' },
]

export default function QrTool() {
  const [kind, setKind] = useState<'url' | 'text' | 'wifi' | 'vcard'>('url')
  const [url, setUrl] = useState('https://example.com')
  const [text, setText] = useState('')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [encryption, setEncryption] = useState<WifiEncryption>('WPA')
  const [hidden, setHidden] = useState(false)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [org, setOrg] = useState('')
  const [title, setTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [site, setSite] = useState('')
  const [foreground, setForeground] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')
  const [level, setLevel] = useState<EcLevel>('M')
  const [levelBeforeLogo, setLevelBeforeLogo] = useState<EcLevel | null>(null)
  const [size, setSize] = useState(280)
  const [margin, setMargin] = useState(4)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoName, setLogoName] = useState('')
  const [logoReadError, setLogoReadError] = useState('')
  const [paint, setPaint] = useState<{
    text: string
    level: EcLevel
    size: number
    margin: number
    foreground: string
    background: string
    logoUrl: string | null
    svg: string
    warning: string
  } | null>(null)
  const [copyError, setCopyError] = useState('')
  const [imageCopied, setImageCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const copyTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
    }
  }, [])

  const payload = useMemo(
    () =>
      buildQrPayload(
        kind === 'url'
          ? { kind, url }
          : kind === 'text'
            ? { kind, text }
            : kind === 'wifi'
              ? { kind, ssid, password, encryption, hidden }
              : { kind, first, last, org, title, phone, email, url: site },
      ),
    [kind, url, text, ssid, password, encryption, hidden, first, last, org, title, phone, email, site],
  )

  const usedLevel = effectiveErrorCorrection(level, Boolean(logoUrl))
  const matched =
    payload.ok &&
    paint &&
    paint.text === payload.text &&
    paint.level === usedLevel &&
    paint.size === size &&
    paint.margin === margin &&
    paint.foreground === foreground &&
    paint.background === background &&
    paint.logoUrl === logoUrl
      ? paint
      : null
  const ready = Boolean(matched?.svg)
  const svg = matched?.svg ?? ''
  const message = !payload.ok ? payload.error : logoReadError || matched?.warning || ''

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !payload.ok) return
    let cancelled = false
    const style = {
      text: payload.text,
      level: usedLevel,
      size,
      margin,
      foreground,
      background,
      logoUrl,
    }
    paintQr(canvas, style).then(
      (result) => {
        if (cancelled) return
        setPaint({ ...style, svg: result.svg, warning: result.logoWarning })
        setCopyError('')
      },
      (error: unknown) => {
        if (cancelled) return
        setPaint({ ...style, svg: '', warning: qrError(error) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [payload, usedLevel, size, margin, foreground, background, logoUrl])

  function chooseLogo(file: File | null) {
    if (!file) {
      setLogoUrl(null)
      setLogoName('')
      setLogoReadError('')
      setLevel(levelBeforeLogo ?? level)
      setLevelBeforeLogo(null)
      return
    }
    const remembered = level
    const reader = new FileReader()
    reader.onload = () => {
      setLogoReadError('')
      setLogoUrl(typeof reader.result === 'string' ? reader.result : null)
      setLogoName(file.name)
      setLevelBeforeLogo((previous) => previous ?? remembered)
      setLevel('H')
    }
    reader.onerror = () => setLogoReadError('Could not read that logo.')
    reader.readAsDataURL(file)
  }

  function downloadPng() {
    const canvas = canvasRef.current
    if (!canvas || !ready) return
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'qr.png')
    }, 'image/png')
  }

  async function copyImage() {
    const canvas = canvasRef.current
    if (!canvas || !ready) return
    setCopyError('')
    try {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        throw new Error('Clipboard image is not available.')
      }
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result)
          else reject(new Error('Could not copy the image.'))
        }, 'image/png')
      })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setImageCopied(true)
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => {
        setImageCopied(false)
        copyTimer.current = null
      }, 2000)
    } catch {
      setCopyError('Could not copy the image. Download the PNG instead.')
    }
  }

  return (
    <div className="tool-layout">
      <section className="card">
        <h1>QR code</h1>
        <p className="lede">URL, text, Wi-Fi, or a contact card. The preview updates as you type.</p>
        <LocalNote />
        <div className="view-toggle" role="group" aria-label="QR content">
          {(
            [
              ['url', 'URL'],
              ['text', 'Text'],
              ['wifi', 'Wi-Fi'],
              ['vcard', 'Contact'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}>
              {label}
            </button>
          ))}
        </div>
        {kind === 'url' ? (
          <Field label="URL" htmlFor="qr-url" hint="Include https:// when the code should open a link.">
            <input
              id="qr-url"
              className="control"
              value={url}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setUrl(event.target.value)}
            />
          </Field>
        ) : null}
        {kind === 'text' ? (
          <Field label="Text" htmlFor="qr-text">
            <textarea
              id="qr-text"
              className="control editor editor--short"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </Field>
        ) : null}
        {kind === 'wifi' ? (
          <>
            <Field label="Network name" htmlFor="qr-ssid">
              <input id="qr-ssid" className="control" value={ssid} autoComplete="off" onChange={(event) => setSsid(event.target.value)} />
            </Field>
            <Field label="Password" htmlFor="qr-password">
              <input
                id="qr-password"
                className="control"
                value={password}
                autoComplete="off"
                disabled={encryption === 'nopass'}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Field label="Encryption" htmlFor="qr-encryption">
              <select
                id="qr-encryption"
                className="control"
                value={encryption}
                onChange={(event) => setEncryption(event.target.value as WifiEncryption)}
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">No password</option>
              </select>
            </Field>
            <label className="check">
              <input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} />
              Hidden network
            </label>
          </>
        ) : null}
        {kind === 'vcard' ? (
          <div className="field-grid">
            <Field label="First name" htmlFor="qr-first">
              <input id="qr-first" className="control" value={first} onChange={(event) => setFirst(event.target.value)} />
            </Field>
            <Field label="Last name" htmlFor="qr-last">
              <input id="qr-last" className="control" value={last} onChange={(event) => setLast(event.target.value)} />
            </Field>
            <Field label="Organization" htmlFor="qr-org">
              <input id="qr-org" className="control" value={org} onChange={(event) => setOrg(event.target.value)} />
            </Field>
            <Field label="Title" htmlFor="qr-title">
              <input id="qr-title" className="control" value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Phone" htmlFor="qr-phone">
              <input id="qr-phone" className="control" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <Field label="Email" htmlFor="qr-email">
              <input id="qr-email" className="control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="URL" htmlFor="qr-site">
              <input id="qr-site" className="control" value={site} spellCheck={false} onChange={(event) => setSite(event.target.value)} />
            </Field>
          </div>
        ) : null}
        <div className="field-grid">
          <Field label="Foreground" htmlFor="qr-fg">
            <input id="qr-fg" type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} />
          </Field>
          <Field label="Background" htmlFor="qr-bg">
            <input id="qr-bg" type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
          </Field>
        </div>
        <Field label="Error correction" htmlFor="qr-level" hint={logoUrl ? 'A center logo uses H so the code can still be scanned.' : undefined}>
          <select
            id="qr-level"
            className="control"
            value={usedLevel}
            disabled={Boolean(logoUrl)}
            onChange={(event) => setLevel(event.target.value as EcLevel)}
          >
            {levels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Size" htmlFor="qr-size">
          <div className="slider-row">
            <input
              id="qr-size"
              type="range"
              min={128}
              max={1024}
              step={8}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            />
            <span className="slider-value">{size}px</span>
          </div>
        </Field>
        <Field label="Margin" htmlFor="qr-margin">
          <div className="slider-row">
            <input
              id="qr-margin"
              type="range"
              min={0}
              max={8}
              step={1}
              value={margin}
              onChange={(event) => setMargin(Number(event.target.value))}
            />
            <span className="slider-value">{margin}</span>
          </div>
        </Field>
        <Field label="Center logo" htmlFor="qr-logo" hint="Optional. The logo is drawn in the browser and is not uploaded.">
          <input
            id="qr-logo"
            className="control"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              event.target.value = ''
              chooseLogo(file)
            }}
          />
          {logoName ? <p className="filename">{logoName}</p> : null}
          {logoUrl ? (
            <button type="button" className="button button--ghost button--small" onClick={() => chooseLogo(null)}>
              Remove logo
            </button>
          ) : null}
        </Field>
      </section>
      <section className="card qr-preview-card">
        <h2 className="section-title">Preview</h2>
        <div className="qr-frame" style={{ background }}>
          <canvas ref={canvasRef} className={ready ? 'qr-canvas' : 'qr-canvas qr-canvas--hidden'} role="img" aria-label="QR code preview" />
        </div>
        {message ? (
          <p className={!payload.ok || logoReadError || !ready ? 'error' : 'notice'} role="status">
            {message}
          </p>
        ) : null}
        <div className="actions">
          <button type="button" className="button" onClick={downloadPng} disabled={!ready}>
            Download PNG
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => downloadText(svg, 'qr.svg', 'image/svg+xml')}
            disabled={!ready || !svg}
          >
            Download SVG
          </button>
          <button type="button" className="button button--ghost" onClick={() => void copyImage()} disabled={!ready}>
            {imageCopied ? 'Copied' : 'Copy image'}
          </button>
        </div>
        {copyError ? <p className="error">{copyError}</p> : null}
        <p className="sr-only" role="status">
          {imageCopied ? 'Copied image' : ''}
        </p>
      </section>
    </div>
  )
}
