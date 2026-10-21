export const defaultZones = [
  'Asia/Kuala_Lumpur',
  'UTC',
  'Europe/London',
  'America/New_York',
  'Asia/Tokyo',
]

export type InstantKind = 'unix-s' | 'unix-ms' | 'iso' | 'wall'

export type InstantSource =
  | { kind: 'unix-s'; value: string }
  | { kind: 'unix-ms'; value: string }
  | { kind: 'iso'; value: string }
  | { kind: 'wall'; value: string; timeZone: string }

const units: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
  { unit: 'second', ms: 1000 },
]

export function isTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(0)
    return true
  } catch {
    return false
  }
}

export function formatZoneParts(date: Date, timeZone: string): { iso: string; offset: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'longOffset',
  }).formatToParts(date)
  const map: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value
  }
  let hour = map.hour ?? '00'
  let day = map.day ?? '01'
  let month = map.month ?? '01'
  let year = map.year ?? '1970'
  if (hour === '24') hour = '00'
  const iso = `${year}-${month}-${day} ${hour}:${map.minute ?? '00'}:${map.second ?? '00'}`
  return { iso, offset: map.timeZoneName ?? '' }
}

function offsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const map: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value
  }
  let hour = Number(map.hour)
  let day = Number(map.day)
  if (hour === 24) {
    hour = 0
    day += 1
  }
  const asUtc = Date.UTC(Number(map.year), Number(map.month) - 1, day, hour, Number(map.minute), Number(map.second))
  return Math.round((asUtc - date.getTime()) / 60000)
}

export function zonedTimeToUtc(wall: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(wall.trim())
  if (!match || !isTimeZone(timeZone)) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6] ?? '0')
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second)
  const firstOffset = offsetMinutes(new Date(utcGuess), timeZone)
  let utc = utcGuess - firstOffset * 60_000
  const secondOffset = offsetMinutes(new Date(utc), timeZone)
  if (secondOffset !== firstOffset) utc = utcGuess - secondOffset * 60_000
  const formatted = formatZoneParts(new Date(utc), timeZone)
  const expected = `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${(match[6] ?? '00').padStart(2, '0')}`
  if (formatted.iso !== expected) return null
  return new Date(utc)
}

export function parseInstant(source: InstantSource): Date | null {
  if (source.kind === 'unix-s' || source.kind === 'unix-ms') {
    const text = source.value.trim()
    if (!/^-?\d+$/.test(text)) return null
    const value = Number(text)
    if (!Number.isSafeInteger(value)) return null
    const ms = source.kind === 'unix-s' ? value * 1000 : value
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (source.kind === 'iso') {
    const text = source.value.trim()
    if (!text) return null
    const date = new Date(text)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return zonedTimeToUtc(source.value, source.timeZone)
}

export function relativeTime(target: Date, now: Date): string {
  const delta = target.getTime() - now.getTime()
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'always' })
  for (const { unit, ms } of units) {
    if (Math.abs(delta) >= ms || unit === 'second') return formatter.format(Math.round(delta / ms), unit)
  }
  return formatter.format(0, 'second')
}
