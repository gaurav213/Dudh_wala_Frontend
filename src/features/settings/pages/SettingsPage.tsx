import { Alert, Card, CardContent, Typography } from '@mui/material'
import { PageHeader } from '../../../components/tables/DataTable'
import { env } from '../../../config/env'

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Admin preferences placeholder" />
      <Card variant="outlined">
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Settings will include notification preferences, export defaults, and org profile once the
            backend endpoints are available.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Environment: <strong>{env.appEnv}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            API base URL: <strong>{env.apiBaseUrl}</strong>
          </Typography>
        </CardContent>
      </Card>
    </>
  )
}
