import { Box, Button, Card, CardContent, Grid2 as Grid, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { formatCurrency, formatDate, formatLiters } from '../../../utils/format'
import { billingApi } from '../api/billingApi'

export function BillDetailPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const query = useQuery({
    queryKey: ['bills', id],
    queryFn: () => billingApi.get(id),
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

  const bill = query.data

  return (
    <Box>
      <PageHeader
        title={`${t('bills')} ${bill.id.slice(0, 8)}`}
        subtitle={`${bill.customerName} · ${bill.supplierName}`}
        actions={
          <Button component={RouterLink} to="/billing" variant="outlined">
            {t('back')}
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Metric label={t('amount')} value={formatCurrency(bill.amount)} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Metric label={t('collected')} value={formatCurrency(bill.paidAmount)} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Metric label={t('outstanding')} value={formatCurrency(bill.outstandingAmount)} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('status')}
              </Typography>
              <StatusChip status={bill.status} />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {formatDate(bill.periodStart)} – {formatDate(bill.periodEnd)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                {t('details')}
              </Typography>
              <Stack spacing={1.5}>
                {bill.lineItems.map((item, idx) => (
                  <Stack key={`${item.description}-${idx}`} direction="row" justifyContent="space-between">
                    <Box>
                      <Typography fontWeight={600}>{item.description}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatLiters(item.quantityLiters)} @ {formatCurrency(item.rate)}
                      </Typography>
                    </Box>
                    <Typography fontWeight={700}>{formatCurrency(item.amount)}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                {t('payments')}
              </Typography>
              <Stack spacing={1.5}>
                {bill.payments.map((p) => (
                  <Box key={p.id}>
                    <Typography fontWeight={600}>
                      {formatCurrency(p.amount)} · {p.method}
                    </Typography>
                    <Typography variant="caption">{formatDate(p.paidAt)}</Typography>
                  </Box>
                ))}
                {!bill.payments.length ? (
                  <Typography color="text.secondary">{t('noData')}</Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}
