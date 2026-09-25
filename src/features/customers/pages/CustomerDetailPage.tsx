import { Box, Button, Card, CardContent, Grid2 as Grid, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { formatCurrency, formatDate, formatLiters } from '../../../utils/format'
import { customersApi } from '../api/customersApi'

export function CustomerDetailPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const query = useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.get(id),
    enabled: Boolean(id),
  })

  if (query.isLoading) return <LoadingState />
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(query.error as Error | undefined)?.message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const customer = query.data

  return (
    <Box>
      <PageHeader
        title={customer.fullName}
        subtitle={`${customer.supplierName} · ${customer.phone || customer.email || t('none')}`}
        actions={
          <Button component={RouterLink} to="/customers" variant="outlined">
            {t('back')}
          </Button>
        }
      />

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <StatusChip status={customer.status} />
            <Typography variant="body2" color="text.secondary">
              {t('from')} {formatDate(customer.createdAt)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <HistoryCard title={t('deliveries')}>
            {customer.deliveries.map((d) => (
              <Box key={d.id} sx={{ mb: 1.5 }}>
                <Typography fontWeight={600}>
                  {formatDate(d.date)} · {formatLiters(d.quantityLiters)}
                </Typography>
                <StatusChip status={d.status} />
              </Box>
            ))}
            {!customer.deliveries.length ? <Typography color="text.secondary">{t('none')}</Typography> : null}
          </HistoryCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HistoryCard title={t('bills')}>
            {customer.bills.map((b) => (
              <Box key={b.id} sx={{ mb: 1.5 }}>
                <Typography fontWeight={600}>
                  {formatDate(b.periodStart)} – {formatDate(b.periodEnd)}
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(b.amount)} · <StatusChip status={b.status} />
                </Typography>
              </Box>
            ))}
            {!customer.bills.length ? <Typography color="text.secondary">{t('none')}</Typography> : null}
          </HistoryCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <HistoryCard title={t('payments')}>
            {customer.payments.map((p) => (
              <Box key={p.id} sx={{ mb: 1.5 }}>
                <Typography fontWeight={600}>
                  {formatDate(p.paidAt)} · {formatCurrency(p.amount)}
                </Typography>
                <Typography variant="body2">
                  {p.method} · <StatusChip status={p.status} />
                </Typography>
              </Box>
            ))}
            {!customer.payments.length ? <Typography color="text.secondary">{t('none')}</Typography> : null}
          </HistoryCard>
        </Grid>
      </Grid>
    </Box>
  )
}

function HistoryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography fontWeight={700} sx={{ mb: 2 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  )
}
