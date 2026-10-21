import { diffArrays, diffChars, diffWordsWithSpace } from 'diff'

export type DiffGranularity = 'word' | 'char'

export type DiffOptions = {
  ignoreWhitespace: boolean
  ignoreCase: boolean
  granularity: DiffGranularity
}

export type InlinePart = {
  text: string
  kind: 'equal' | 'added' | 'removed'
}

export type DiffRow = {
  type: 'context' | 'del' | 'add' | 'change'
  left: InlinePart[] | null
  right: InlinePart[] | null
  leftNumber: number | null
  rightNumber: number | null
}

export type DiffModel = {
  rows: DiffRow[]
  added: number
  removed: number
  truncated: boolean
}

export function splitLines(text: string): string[] {
  if (text.length === 0) return []
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

function normalizeLine(line: string, options: DiffOptions): string {
  let value = line
  if (options.ignoreWhitespace) value = value.replace(/\s+/g, '')
  if (options.ignoreCase) value = value.toLowerCase()
  return value
}

function whole(text: string, kind: InlinePart['kind']): InlinePart[] {
  return [{ text, kind }]
}

function highlight(
  left: string,
  right: string,
  options: DiffOptions,
): { left: InlinePart[]; right: InlinePart[] } {
  if (left.length > 8000 || right.length > 8000) {
    return { left: whole(left, 'removed'), right: whole(right, 'added') }
  }
  const changes =
    options.granularity === 'char'
      ? diffChars(left, right, { ignoreCase: options.ignoreCase })
      : diffWordsWithSpace(left, right, { ignoreCase: options.ignoreCase })
  const leftParts: InlinePart[] = []
  const rightParts: InlinePart[] = []
  for (const change of changes) {
    if (!change.value) continue
    if (change.added) rightParts.push({ text: change.value, kind: 'added' })
    else if (change.removed) leftParts.push({ text: change.value, kind: 'removed' })
    else {
      leftParts.push({ text: change.value, kind: 'equal' })
      rightParts.push({ text: change.value, kind: 'equal' })
    }
  }
  return {
    left: leftParts.length > 0 ? leftParts : whole(left, 'removed'),
    right: rightParts.length > 0 ? rightParts : whole(right, 'added'),
  }
}

type Op =
  | { type: 'eq'; left: string; right: string }
  | { type: 'del'; left: string }
  | { type: 'add'; right: string }

export function buildDiff(leftText: string, rightText: string, options: DiffOptions): DiffModel {
  const leftLines = splitLines(leftText)
  const rightLines = splitLines(rightText)
  const changes = diffArrays(leftLines, rightLines, {
    comparator: (leftLine, rightLine) => normalizeLine(leftLine, options) === normalizeLine(rightLine, options),
    maxEditLength: 20000,
  })
  if (!changes) return { rows: [], added: 0, removed: 0, truncated: true }

  const ops: Op[] = []
  let leftIndex = 0
  let rightIndex = 0
  for (const change of changes) {
    const count = change.count
    if (change.removed) {
      for (let index = 0; index < count; index += 1) {
        ops.push({ type: 'del', left: leftLines[leftIndex] ?? '' })
        leftIndex += 1
      }
    } else if (change.added) {
      for (let index = 0; index < count; index += 1) {
        ops.push({ type: 'add', right: rightLines[rightIndex] ?? '' })
        rightIndex += 1
      }
    } else {
      for (let index = 0; index < count; index += 1) {
        ops.push({
          type: 'eq',
          left: leftLines[leftIndex] ?? '',
          right: rightLines[rightIndex] ?? '',
        })
        leftIndex += 1
        rightIndex += 1
      }
    }
  }

  const pending: Array<Omit<DiffRow, 'leftNumber' | 'rightNumber'>> = []
  let added = 0
  let removed = 0
  let cursor = 0
  while (cursor < ops.length) {
    const op = ops[cursor]
    if (!op) break
    if (op.type === 'eq') {
      pending.push({
        type: 'context',
        left: whole(op.left, 'equal'),
        right: whole(op.right, 'equal'),
      })
      cursor += 1
      continue
    }
    const deleted: string[] = []
    const inserted: string[] = []
    while (cursor < ops.length && ops[cursor]?.type !== 'eq') {
      const next = ops[cursor]
      if (next?.type === 'del') deleted.push(next.left)
      if (next?.type === 'add') inserted.push(next.right)
      cursor += 1
    }
    const paired = Math.min(deleted.length, inserted.length)
    for (let index = 0; index < paired; index += 1) {
      const parts = highlight(deleted[index] ?? '', inserted[index] ?? '', options)
      pending.push({ type: 'change', left: parts.left, right: parts.right })
      added += 1
      removed += 1
    }
    for (const line of deleted.slice(paired)) {
      pending.push({ type: 'del', left: whole(line, 'removed'), right: null })
      removed += 1
    }
    for (const line of inserted.slice(paired)) {
      pending.push({ type: 'add', left: null, right: whole(line, 'added') })
      added += 1
    }
  }

  let leftNumber = 1
  let rightNumber = 1
  const rows: DiffRow[] = pending.map((row) => ({
    ...row,
    leftNumber: row.left ? leftNumber++ : null,
    rightNumber: row.right ? rightNumber++ : null,
  }))
  return { rows, added, removed, truncated: false }
}
