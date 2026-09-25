export type ThemeModePref = 'light' | 'dark' | 'system'

const STORAGE_THEME = 'prefs.themeMode'

/** Default is light = current existing theme. */
export function readStoredThemeMode(): ThemeModePref {
  const raw = localStorage.getItem(STORAGE_THEME)
  if (raw === 'dark' || raw === 'system' || raw === 'light') return raw
  return 'light'
}

export function persistThemeMode(mode: ThemeModePref) {
  localStorage.setItem(STORAGE_THEME, mode)
}

export function resolveThemeMode(mode: ThemeModePref): 'light' | 'dark' {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
