import { InboxOutlined } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Stack alignItems="center" spacing={1} sx={{ py: 8, color: 'text.secondary' }}>
      <InboxOutlined sx={{ fontSize: 40, opacity: 0.5 }} />
      <Typography fontWeight={600}>{title}</Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      ) : null}
      {action ? <Stack sx={{ pt: 1 }}>{action}</Stack> : null}
    </Stack>
  )
}
