export type EcLevel = 'L' | 'M' | 'Q' | 'H'
export type WifiEncryption = 'WPA' | 'WEP' | 'nopass'

export type QrInput =
  | { kind: 'url'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'wifi'; ssid: string; password: string; encryption: WifiEncryption; hidden: boolean }
  | {
      kind: 'vcard'
      first: string
      last: string
      org: string
      title: string
      phone: string
      email: string
      url: string
    }

export function effectiveErrorCorrection(level: EcLevel, hasLogo: boolean): EcLevel {
  if (!hasLogo) return level
  return 'H'
}

export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

export function buildWifi(input: {
  ssid: string
  password: string
  encryption: WifiEncryption
  hidden: boolean
}): string {
  const ssid = escapeWifi(input.ssid)
  const hidden = input.hidden ? 'true' : 'false'
  if (input.encryption === 'nopass') return `WIFI:T:nopass;S:${ssid};H:${hidden};;`
  return `WIFI:T:${input.encryption};S:${ssid};P:${escapeWifi(input.password)};H:${hidden};;`
}

export function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export function buildVCard(input: {
  first: string
  last: string
  org: string
  title: string
  phone: string
  email: string
  url: string
}): string {
  const first = input.first.trim()
  const last = input.last.trim()
  const org = input.org.trim()
  const title = input.title.trim()
  const phone = input.phone.trim()
  const email = input.email.trim()
  const url = input.url.trim()
  const fullName = [first, last].filter(Boolean).join(' ') || org || email || phone
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  if (last || first) lines.push(`N:${escapeVCard(last)};${escapeVCard(first)};;;`)
  if (fullName) lines.push(`FN:${escapeVCard(fullName)}`)
  if (org) lines.push(`ORG:${escapeVCard(org)}`)
  if (title) lines.push(`TITLE:${escapeVCard(title)}`)
  if (phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(phone)}`)
  if (email) lines.push(`EMAIL:${escapeVCard(email)}`)
  if (url) lines.push(`URL:${escapeVCard(url)}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export function buildQrPayload(input: QrInput): { ok: true; text: string } | { ok: false; error: string } {
  if (input.kind === 'url') {
    const url = input.url.trim()
    if (!url) return { ok: false, error: 'Enter a URL.' }
    return { ok: true, text: url }
  }
  if (input.kind === 'text') {
    if (!input.text) return { ok: false, error: 'Enter some text.' }
    return { ok: true, text: input.text }
  }
  if (input.kind === 'wifi') {
    if (!input.ssid.trim()) return { ok: false, error: 'Enter the network name.' }
    if (input.encryption !== 'nopass' && !input.password) {
      return { ok: false, error: 'Enter the Wi-Fi password, or choose no password.' }
    }
    return { ok: true, text: buildWifi(input) }
  }
  const hasContact = [input.first, input.last, input.org, input.title, input.phone, input.email, input.url].some(
    (value) => value.trim(),
  )
  if (!hasContact) return { ok: false, error: 'Enter a name, phone, or email.' }
  return { ok: true, text: buildVCard(input) }
}
