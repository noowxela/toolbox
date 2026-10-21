export type ImageFormat = 'jpeg' | 'png' | 'webp'

export type ResizeOptions =
  | { mode: 'max'; maxWidth: number | null; maxHeight: number | null }
  | { mode: 'percent'; percent: number }

export function targetSize(
  width: number,
  height: number,
  options: ResizeOptions,
): { width: number; height: number } {
  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  if (options.mode === 'percent') {
    const percent = Math.min(100, Math.max(1, options.percent)) / 100
    return {
      width: Math.max(1, Math.round(safeWidth * percent)),
      height: Math.max(1, Math.round(safeHeight * percent)),
    }
  }
  const maxWidth = options.maxWidth && options.maxWidth > 0 ? options.maxWidth : safeWidth
  const maxHeight = options.maxHeight && options.maxHeight > 0 ? options.maxHeight : safeHeight
  const scale = Math.min(1, maxWidth / safeWidth, maxHeight / safeHeight)
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  }
}

export function outputName(original: string, format: ImageFormat): string {
  const trimmed = original.trim() || 'image'
  const base = trimmed.replace(/\.[^.]+$/, '') || 'image'
  const extension = format === 'jpeg' ? 'jpg' : format
  return `${base}.${extension}`
}

export function percentSaved(before: number, after: number): number {
  if (before <= 0) return 0
  return Math.round((1 - after / before) * 100)
}

export function savingsLabel(before: number, after: number): string {
  const saved = percentSaved(before, after)
  if (saved > 0) return `${saved}% smaller`
  if (saved < 0) return `${Math.abs(saved)}% larger`
  return 'same size'
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function uniqueZipNames(names: string[]): string[] {
  const seen = new Map<string, number>()
  return names.map((name) => {
    const count = seen.get(name) ?? 0
    seen.set(name, count + 1)
    if (count === 0) return name
    const dot = name.lastIndexOf('.')
    if (dot <= 0) return `${name}-${count + 1}`
    return `${name.slice(0, dot)}-${count + 1}${name.slice(dot)}`
  })
}
