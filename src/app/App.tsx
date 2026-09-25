import { ErrorBoundary } from '../components/feedback/ErrorBoundary'
import { AppProviders } from './providers'
import { AppRouter } from './router'

export function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </AppProviders>
  )
}

export default App
