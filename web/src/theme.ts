export type Theme = 'light' | 'dark'

const storageKey = 'toolbox-theme'

export function readTheme(): Theme {
  if (typeof document !== 'undefined') {
    const set = document.documentElement.dataset.theme
    if (set === 'light' || set === 'dark') return set
  }
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Private browsing can block storage. The page still follows the system.
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    // The theme still applies for this visit.
  }
}
