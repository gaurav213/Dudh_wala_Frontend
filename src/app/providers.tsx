import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { queryClient } from '../lib/query/client'
import i18n from '../i18n'
import { PrefsProvider } from '../features/settings/prefs/PrefsContext'
import { usePrefs } from '../features/settings/prefs/usePrefs'
import { darkTheme, lightTheme } from './theme'

function ThemedApp({ children }: { children: ReactNode }) {
  const { resolvedMode } = usePrefs()
  return (
    <ThemeProvider theme={resolvedMode === 'dark' ? darkTheme : lightTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <PrefsProvider>
          <ThemedApp>{children}</ThemedApp>
        </PrefsProvider>
      </QueryClientProvider>
    </I18nextProvider>
  )
}
