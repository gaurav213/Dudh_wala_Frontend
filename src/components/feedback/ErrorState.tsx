import { Alert, Button, Stack, Typography } from '@mui/material'

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <Stack spacing={2} sx={{ py: 4 }}>
      <Alert severity="error" action={onRetry ? <Button onClick={onRetry}>Retry</Button> : undefined}>
        <Typography fontWeight={700}>{title}</Typography>
        {message ? <Typography variant="body2">{message}</Typography> : null}
      </Alert>
    </Stack>
  )
}
