import { Button, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export function SessionExpiredPage() {
  return (
    <Stack minHeight="100vh" alignItems="center" justifyContent="center" px={2}>
      <Paper sx={{ p: 4, maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Session expired
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Your session ended or the refresh token is no longer valid. Sign in again to continue.
        </Typography>
        <Button component={RouterLink} to="/login" variant="contained">
          Back to login
        </Button>
      </Paper>
    </Stack>
  )
}

export function UnauthorizedPage() {
  return (
    <Stack minHeight="100vh" alignItems="center" justifyContent="center" px={2}>
      <Paper sx={{ p: 4, maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Unauthorized
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          You do not have permission to access this area. Admin role is required.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Go to dashboard
        </Button>
      </Paper>
    </Stack>
  )
}
