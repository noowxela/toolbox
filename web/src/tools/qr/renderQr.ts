import { toCanvas, toString } from 'qrcode'
import type { EcLevel } from './payload.ts'

export type QrStyle = {
  text: string
  level: EcLevel
  size: number
  margin: number
  foreground: string
  background: string
  logoUrl: string | null
}

function rgba(hex: string, fallback: string): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex)
  return match ? `#${match[1]}ff` : fallback
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read that logo.'))
    image.src = url
  })
}

async function drawLogo(canvas: HTMLCanvasElement, url: string, background: string) {
  const image = await loadImage(url)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not draw the logo.')
  const box = Math.round(canvas.width * 0.22)
  const pad = Math.round(canvas.width * 0.03)
  const x = Math.round((canvas.width - box) / 2)
  const y = Math.round((canvas.height - box) / 2)
  context.fillStyle = background
  context.fillRect(x - pad, y - pad, box + pad * 2, box + pad * 2)
  context.drawImage(image, x, y, box, box)
}

function embedLogo(svg: string, dataUrl: string, background: string): string {
  const extra = `<rect x="36%" y="36%" width="28%" height="28%" fill="${escapeAttr(background)}" /><image href="${escapeAttr(dataUrl)}" x="39%" y="39%" width="22%" height="22%" preserveAspectRatio="xMidYMid meet" />`
  const end = svg.lastIndexOf('</svg>')
  if (end === -1) return svg
  return `${svg.slice(0, end)}${extra}${svg.slice(end)}`
}

export function qrError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (/too big|too long|minimum size/i.test(message)) {
    return 'That content is too long for a QR code at this error correction level.'
  }
  return message || 'Could not build that QR code.'
}

export async function paintQr(
  canvas: HTMLCanvasElement,
  style: QrStyle,
): Promise<{ svg: string; logoWarning: string }> {
  const dark = rgba(style.foreground, '#000000ff')
  const light = rgba(style.background, '#ffffffff')
  const options = {
    errorCorrectionLevel: style.level,
    width: style.size,
    margin: style.margin,
    color: { dark, light },
  }
  await toCanvas(canvas, style.text, options)
  let logoWarning = ''
  if (style.logoUrl) {
    try {
      await drawLogo(canvas, style.logoUrl, style.background)
    } catch (error) {
      logoWarning = error instanceof Error ? error.message : 'Could not read that logo.'
    }
  }
  let svg = await toString(style.text, { ...options, type: 'svg' })
  if (style.logoUrl && !logoWarning) svg = embedLogo(svg, style.logoUrl, style.background)
  return { svg, logoWarning }
}
