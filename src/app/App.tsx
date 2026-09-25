import { ErrorBoundary } from '../components/feedback/ErrorBoundary'
import { InboxNotificationPoller } from '../features/notifications/InboxNotificationPoller'
import { AppProviders } from './providers'
import { AppRouter } from './router'

export function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <InboxNotificationPoller />
        <AppRouter />
      </ErrorBoundary>
    </AppProviders>
  )
}

export default App
