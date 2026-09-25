import { CircularProgress, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation()

  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 8 }}>
      <CircularProgress size={36} />
      <Typography color="text.secondary">{label ?? t('loading')}</Typography>
    </Stack>
  )
}
