import { describe, expect, it } from 'vitest'
import {
  csvToJson,
  formatJson,
  indexToLineColumn,
  jsonToCsv,
  jsonToYaml,
  parseJson,
  sortKeysDeep,
  yamlToJsonValue,
} from './convert.ts'

describe('JSON errors and formatting', () => {
  it('maps a character index to a line and column', () => {
    expect(indexToLineColumn('a\nbc', 2)).toEqual({ line: 2, column: 1 })
  })

  it('reports the line and column of invalid JSON', () => {
    const result = parseJson('{\n  "a": 1,\n}\n')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.line).toBeGreaterThan(1)
      expect(result.error.column).toBeGreaterThan(0)
      expect(result.error.message.length).toBeGreaterThan(0)
    }
  })

  it('formats, minifies, and sorts keys', () => {
    const formatted = formatJson('{"b":1,"a":{"d":1,"c":2}}', { indent: '  ', sort: true, minify: false })
    expect(formatted.ok && formatted.text).toBe('{\n  "a": {\n    "c": 2,\n    "d": 1\n  },\n  "b": 1\n}')
    const minified = formatJson('{\n  "a": 1\n}', { indent: '  ', sort: false, minify: true })
    expect(minified.ok && minified.text).toBe('{"a":1}')
    expect(sortKeysDeep({ b: 1, a: [3, { y: 1, x: 2 }] })).toEqual({ a: [3, { x: 2, y: 1 }], b: 1 })
  })
})

describe('YAML conversion', () => {
  it('round-trips JSON and keeps YAML 1.2 words as text', () => {
    expect(yamlToJsonValue('name: Ada\ncount: 2\n')).toEqual({ name: 'Ada', count: 2 })
    expect(yamlToJsonValue('yes')).toBe('yes')
    expect(yamlToJsonValue('true')).toBe(true)
    const yaml = jsonToYaml({ b: 1, a: [true, null, 'yes'] })
    expect(yamlToJsonValue(yaml)).toEqual({ b: 1, a: [true, null, 'yes'] })
  })
})

describe('CSV conversion', () => {
  it('writes an array of objects and quotes special cells', () => {
    expect(
      jsonToCsv([
        { name: 'Ada', city: 'KL' },
        { name: 'Lin, Bo', note: 'a "b"' },
      ]),
    ).toBe('name,city,note\nAda,KL,\n"Lin, Bo",,"a ""b"""\n')
  })

  it('stores nested values as JSON text', () => {
    expect(jsonToCsv([{ user: { id: 1 } }])).toBe('user\n"{""id"":1}"\n')
    expect(csvToJson('user\n"{""id"":1}"\n')).toEqual([{ user: '{"id":1}' }])
  })

  it('reads quoted newlines and duplicate headers', () => {
    expect(csvToJson('name,note\nAda,"line1\nline2"\n')).toEqual([{ name: 'Ada', note: 'line1\nline2' }])
    expect(csvToJson('name,name\nA,B\n')).toEqual([{ name: 'A', name_2: 'B' }])
  })

  it('rejects JSON that is not an array of objects', () => {
    expect(() => jsonToCsv({ name: 'Ada' })).toThrow('CSV export needs a JSON array of objects.')
    expect(() => jsonToCsv([])).toThrow('CSV export needs at least one object.')
  })
})
