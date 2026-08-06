import { InboxOutlined } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Stack alignItems="center" spacing={1} sx={{ py: 8, color: 'text.secondary' }}>
      <InboxOutlined sx={{ fontSize: 40, opacity: 0.5 }} />
      <Typography fontWeight={600}>{title}</Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      ) : null}
    </Stack>
  )
}
