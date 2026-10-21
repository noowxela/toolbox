import { describe, expect, it } from 'vitest'
import { buildQrPayload, buildVCard, buildWifi, effectiveErrorCorrection } from './payload.ts'

describe('Wi-Fi QR payload', () => {
  it('escapes separators and marks a hidden network', () => {
    expect(
      buildWifi({
        ssid: 'my;net',
        password: 'a:b\\c',
        encryption: 'WPA',
        hidden: true,
      }),
    ).toBe('WIFI:T:WPA;S:my\\;net;P:a\\:b\\\\c;H:true;;')
  })

  it('omits the password when the network is open', () => {
    expect(buildWifi({ ssid: 'Cafe', password: 'secret', encryption: 'nopass', hidden: false })).toBe(
      'WIFI:T:nopass;S:Cafe;H:false;;',
    )
  })

  it('asks for a password when the network is protected', () => {
    const result = buildQrPayload({
      kind: 'wifi',
      ssid: 'Cafe',
      password: '',
      encryption: 'WPA',
      hidden: false,
    })
    expect(result.ok).toBe(false)
  })
})

describe('vCard QR payload', () => {
  it('builds a version 3 card with CRLF lines', () => {
    expect(
      buildVCard({
        first: 'Ada',
        last: 'Lovelace',
        org: 'Analytical Engines',
        title: 'Mathematician',
        phone: '+60 12',
        email: 'ada@example.com',
        url: 'https://example.com',
      }),
    ).toBe(
      [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Lovelace;Ada;;;',
        'FN:Ada Lovelace',
        'ORG:Analytical Engines',
        'TITLE:Mathematician',
        'TEL;TYPE=CELL:+60 12',
        'EMAIL:ada@example.com',
        'URL:https://example.com',
        'END:VCARD',
      ].join('\r\n'),
    )
  })

  it('escapes commas and semicolons in the name', () => {
    expect(
      buildVCard({
        first: 'Ann, Lee',
        last: 'Doe;Jr',
        org: '',
        title: '',
        phone: '',
        email: '',
        url: '',
      }),
    ).toContain('N:Doe\\;Jr;Ann\\, Lee;;;')
  })
})

describe('error correction', () => {
  it('raises a lower level to H when a logo is present', () => {
    expect(effectiveErrorCorrection('L', false)).toBe('L')
    expect(effectiveErrorCorrection('M', true)).toBe('H')
    expect(effectiveErrorCorrection('H', true)).toBe('H')
  })
})
