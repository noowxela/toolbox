export function hashToPath(hash: string): string {
  const raw = hash.replace(/^#/, '').trim()
  if (!raw || raw === '/') return '/'
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`
  const path = withSlash.split('?')[0] ?? '/'
  const trimmed = path.replace(/\/+$/, '')
  return trimmed || '/'
}
