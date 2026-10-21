import { describe, expect, it } from 'vitest'
import { hashToPath } from './router.ts'

describe('hashToPath', () => {
  it('treats an empty hash as the tool list', () => {
    expect(hashToPath('')).toBe('/')
    expect(hashToPath('#')).toBe('/')
    expect(hashToPath('#/')).toBe('/')
  })

  it('reads a tool path with or without a leading slash', () => {
    expect(hashToPath('#/qr')).toBe('/qr')
    expect(hashToPath('#/qr/')).toBe('/qr')
    expect(hashToPath('#qr')).toBe('/qr')
    expect(hashToPath('#/json?x=1')).toBe('/json')
  })
})
