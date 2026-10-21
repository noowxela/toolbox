import { parse, stringify, YAMLParseError } from 'yaml'

export type JsonIssue = {
  line: number
  column: number
  message: string
  lineText: string
}

export type JsonSuccess = { ok: true; value: unknown }
export type JsonFailure = { ok: false; error: JsonIssue }
export type JsonResult = JsonSuccess | JsonFailure

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, '')
}

export function indexToLineColumn(source: string, index: number): { line: number; column: number } {
  const clipped = Math.max(0, Math.min(index, source.length))
  let line = 1
  let column = 1
  for (let cursor = 0; cursor < clipped; cursor += 1) {
    if (source[cursor] === '\n') {
      line += 1
      column = 1
    } else {
      column += 1
    }
  }
  return { line, column }
}

function cleanMessage(message: string): string {
  return message
    .replace(/^JSON\.parse:\s*/i, '')
    .replace(/\s+in JSON at position \d+.*/i, '')
    .replace(/\s+at position \d+.*/i, '')
    .replace(/\s+at line \d+ column \d+.*/i, '')
    .replace(/\s+of the JSON data.*/i, '')
}

export function locateJsonError(source: string, error: unknown): JsonIssue {
  const raw = error instanceof Error ? error.message : 'Invalid JSON.'
  const lineColumn = /line (\d+) column (\d+)/i.exec(raw)
  const position = /position (\d+)/i.exec(raw)
  const located = lineColumn
    ? { line: Number(lineColumn[1]), column: Number(lineColumn[2]) }
    : position
      ? indexToLineColumn(source, Number(position[1]))
      : { line: 1, column: 1 }
  const lineText = source.split('\n')[located.line - 1] ?? ''
  return { ...located, message: cleanMessage(raw), lineText }
}

export function parseJson(text: string): JsonResult {
  const source = stripBom(text)
  try {
    return { ok: true, value: JSON.parse(source) as unknown }
  } catch (error) {
    return { ok: false, error: locateJsonError(source, error) }
  }
}

export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sortKeysDeep(item))
  if (!isRecord(value)) return value
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(value).sort((left, right) => left.localeCompare(right, 'en', { numeric: true }))) {
    sorted[key] = sortKeysDeep(value[key])
  }
  return sorted
}

export function formatJson(
  text: string,
  options: { indent: string; sort: boolean; minify: boolean },
): JsonFailure | { ok: true; text: string; value: unknown } {
  const parsed = parseJson(text)
  if (!parsed.ok) return parsed
  const value = options.sort ? sortKeysDeep(parsed.value) : parsed.value
  const formatted = options.minify ? JSON.stringify(value) : JSON.stringify(value, null, options.indent)
  return { ok: true, text: formatted ?? '', value }
}

export function jsonToYaml(value: unknown): string {
  return (
    stringify(value, {
      schema: 'core',
      aliasDuplicateObjects: false,
      lineWidth: 0,
    }) ?? ''
  )
}

export function yamlErrorMessage(error: unknown): string {
  if (error instanceof YAMLParseError && error.linePos?.[0]) {
    const place = error.linePos[0]
    return `Line ${place.line}, column ${place.col}: ${error.message}`
  }
  return error instanceof Error ? error.message : 'Could not read that YAML.'
}

export function yamlToJsonValue(text: string): unknown {
  if (!text.trim()) throw new Error('Enter YAML to convert.')
  const value = parse(text, { schema: 'core', uniqueKeys: true }) as unknown
  if (typeof value === 'undefined') throw new Error('YAML did not contain a value.')
  return value
}

function cellText(value: unknown): string {
  if (value === null || typeof value === 'undefined') return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value) ?? ''
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function jsonToCsv(value: unknown): string {
  if (!Array.isArray(value) || value.some((row) => !isRecord(row))) {
    throw new Error('CSV export needs a JSON array of objects.')
  }
  if (value.length === 0) throw new Error('CSV export needs at least one object.')
  const headers: string[] = []
  for (const row of value) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key)
    }
  }
  if (headers.length === 0) throw new Error('CSV export needs objects with keys.')
  const lines = [headers.map((header) => escapeCsv(header)).join(',')]
  for (const row of value) {
    lines.push(headers.map((key) => escapeCsv(cellText(row[key]))).join(','))
  }
  return `${lines.join('\n')}\n`
}

export function parseCsv(text: string): string[][] {
  const source = stripBom(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index] ?? ''
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
      continue
    }
    if (char === ',') {
      row.push(cell)
      cell = ''
      continue
    }
    if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }
    cell += char
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>()
  return headers.map((header, index) => {
    const name = header.trim() || `column_${index + 1}`
    const count = seen.get(name) ?? 0
    seen.set(name, count + 1)
    return count === 0 ? name : `${name}_${count + 1}`
  })
}

export function csvToJson(text: string): Record<string, string>[] {
  const rows = parseCsv(text).filter((row) => !(row.length === 1 && row[0] === ''))
  if (rows.length === 0) throw new Error('CSV is empty.')
  const headers = uniqueHeaders(rows[0] ?? [])
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = row[index] ?? ''
    })
    return record
  })
}
