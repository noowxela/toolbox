import { describe, expect, it } from 'vitest'
import { defaultZones, formatZoneParts, isTimeZone, parseInstant, relativeTime, zonedTimeToUtc } from './convert.ts'

describe('timestamp conversion', () => {
  it('starts from Kuala Lumpur and reads Unix, ISO, and wall time', () => {
    expect(defaultZones[0]).toBe('Asia/Kuala_Lumpur')
    expect(isTimeZone('Asia/Kuala_Lumpur')).toBe(true)
    expect(isTimeZone('Not/AZone')).toBe(false)

    const utc = new Date('2026-10-21T00:00:00.000Z')
    const kualaLumpur = formatZoneParts(utc, 'Asia/Kuala_Lumpur')
    expect(kualaLumpur.iso).toBe('2026-10-21 08:00:00')
    expect(kualaLumpur.offset).toMatch(/GMT\+0?8/)

    expect(zonedTimeToUtc('2026-10-21T08:00:00', 'Asia/Kuala_Lumpur')?.toISOString()).toBe(
      '2026-10-21T00:00:00.000Z',
    )
    expect(parseInstant({ kind: 'unix-s', value: '0' })?.toISOString()).toBe('1970-01-01T00:00:00.000Z')
    expect(parseInstant({ kind: 'unix-ms', value: '1000' })?.toISOString()).toBe('1970-01-01T00:00:01.000Z')
    expect(parseInstant({ kind: 'iso', value: '2026-10-21T00:00:00.000Z' })?.toISOString()).toBe(
      '2026-10-21T00:00:00.000Z',
    )
    expect(parseInstant({ kind: 'unix-s', value: '1.5' })).toBeNull()
    expect(parseInstant({ kind: 'iso', value: 'not a date' })).toBeNull()
  })

  it('follows daylight saving time in New York', () => {
    expect(formatZoneParts(new Date('2026-01-15T05:00:00Z'), 'America/New_York').iso).toBe('2026-01-15 00:00:00')
    expect(formatZoneParts(new Date('2026-07-15T04:00:00Z'), 'America/New_York').iso).toBe('2026-07-15 00:00:00')
  })

  it('describes a moment three days earlier', () => {
    const now = new Date('2026-10-21T00:00:00.000Z')
    const then = new Date('2026-10-18T00:00:00.000Z')
    expect(relativeTime(then, now)).toBe('3 days ago')
    expect(relativeTime(now, then)).toBe('in 3 days')
  })
})
