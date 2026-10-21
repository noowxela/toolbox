import { describe, expect, it } from 'vitest'
import { buildDiff, type DiffOptions } from './diffText.ts'

const base: DiffOptions = { ignoreWhitespace: false, ignoreCase: false, granularity: 'word' }

describe('buildDiff', () => {
  it('counts added and removed lines and keeps the surrounding lines', () => {
    const model = buildDiff('a\nb\nc\n', 'a\nc\n', base)
    expect(model.added).toBe(0)
    expect(model.removed).toBe(1)
    expect(model.rows.map((row) => row.type)).toEqual(['context', 'del', 'context'])
    expect(model.rows[2]?.leftNumber).toBe(3)
    expect(model.rows[2]?.rightNumber).toBe(2)
  })

  it('highlights the changed word and, at character level, the changed letter', () => {
    const words = buildDiff('keep different\n', 'keep changed\n', base)
    const wordRow = words.rows[0]
    expect(wordRow?.type).toBe('change')
    expect(wordRow?.left?.some((part) => part.kind === 'removed' && part.text.includes('different'))).toBe(true)
    expect(wordRow?.right?.some((part) => part.kind === 'added' && part.text.includes('changed'))).toBe(true)

    const letters = buildDiff('cat\n', 'cot\n', { ...base, granularity: 'char' })
    const letterRow = letters.rows[0]
    expect(letterRow?.left?.some((part) => part.kind === 'removed' && part.text === 'a')).toBe(true)
    expect(letterRow?.right?.some((part) => part.kind === 'added' && part.text === 'o')).toBe(true)
  })

  it('ignores case and whitespace when asked', () => {
    const cased = buildDiff('Hello\n', 'hello\n', { ...base, ignoreCase: true })
    expect(cased.added).toBe(0)
    expect(cased.removed).toBe(0)

    const spaced = buildDiff('a b\n', 'ab\n', { ...base, ignoreWhitespace: true })
    expect(spaced.added).toBe(0)
    expect(spaced.removed).toBe(0)
  })

  it('treats CRLF the same as LF', () => {
    const model = buildDiff('a\r\nb\r\n', 'a\r\nc\r\n', base)
    expect(model.removed).toBe(1)
    expect(model.added).toBe(1)
  })
})
