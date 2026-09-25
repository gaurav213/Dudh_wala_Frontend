import { Button, Stack, Typography } from '@mui/material'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18n from '../../i18n'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** Top-level fallback so an uncaught render error shows a recovery screen instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <Stack
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: '100vh', textAlign: 'center', p: 3 }}
      >
        <Typography variant="h5" fontWeight={800}>
          {i18n.t('somethingWentWrong')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {i18n.t('unexpectedErrorBody')}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          {i18n.t('reload')}
        </Button>
      </Stack>
    )
  }
}
