import { Alert, Button, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  const { t } = useTranslation()

  return (
    <Stack spacing={2} sx={{ py: 4 }}>
      <Alert
        severity="error"
        action={onRetry ? <Button onClick={onRetry}>{t('retry')}</Button> : undefined}
      >
        <Typography fontWeight={700}>{title ?? t('somethingWentWrong')}</Typography>
        {message ? <Typography variant="body2">{message}</Typography> : null}
      </Alert>
    </Stack>
  )
}
