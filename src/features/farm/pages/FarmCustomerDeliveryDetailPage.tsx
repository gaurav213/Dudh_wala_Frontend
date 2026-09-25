import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid2 as Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader } from '../../../components/tables/DataTable'
import { formatCurrency, formatLiters } from '../../../utils/format'
import { billingApi } from '../../billing/api/billingApi'
import { farmDeliveriesApi } from '../api/farmDeliveriesApi'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
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

function todayIso() {
  const n = new Date()
  const y = n.getFullYear()
  const m = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isCustomerNoMilk(notes?: string | null, status?: string) {
  return status === 'SKIPPED' && String(notes ?? '').includes('Customer:')
}

export function FarmCustomerDeliveryDetailPage() {
  const { t } = useTranslation()
  const { customerId = '' } = useParams()
  const [search] = useSearchParams()
  const day =
    search.get('date') && /^\d{4}-\d{2}-\d{2}$/.test(search.get('date')!)
      ? search.get('date')!
      : todayIso()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['farm', 'customer-delivery-detail', customerId],
    queryFn: () => farmDeliveriesApi.customerDetail(customerId),
    enabled: Boolean(customerId),
  })

  const dayQuery = useQuery({
    queryKey: ['farm', 'deliveries', 'customer-day', customerId, day],
    queryFn: () => farmDeliveriesApi.today({ from: day, to: day }),
    enabled: Boolean(customerId),
    select: (rows) => rows.filter((d) => d.customerId === customerId),
  })

  const generateBill = useMutation({
    mutationFn: () => {
      const now = new Date()
      const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      return billingApi.generate({ customerId, billingMonth })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['farm', 'customer-delivery-detail', customerId],
      })
    },
  })

  if (query.isLoading) return <LoadingState label={t('loading')} />
  if (query.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const data = query.data!
  const dayRows = dayQuery.data ?? []
  const pending = dayRows.filter(
    (d) => d.status === 'PENDING' || d.status === 'OUT_FOR_DELIVERY',
  )
  const delivered = dayRows.filter((d) => d.status === 'DELIVERED')
  const dayScheduled = dayRows.reduce((a, d) => a + Number(d.scheduledQuantity || 0), 0)
  const dayExtra = dayRows.reduce(
    (a, d) =>
      a + Number(d.customerExtraQuantity || 0) + Number(d.staffExtraQuantity || 0),
    0,
  )
  const dayDeliveredQty = delivered.reduce(
    (a, d) => a + Number(d.finalDeliveredQuantity || d.expectedQuantity || 0),
    0,
  )
  const pendingQty = pending.reduce(
    (a, d) => a + Number(d.expectedQuantity || d.scheduledQuantity || 0),
    0,
  )
  const billing = data.billing

  return (
    <Box>
      <PageHeader
        title={data.customer.name}
        subtitle={`${data.customer.mobileNumber}${data.customer.address ? ` · ${data.customer.address}` : ''}`}
        actions={
          <Button component={RouterLink} to="/farm/today" variant="outlined">
            {t('backToMilkList')}
          </Button>
        }
      />

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        {t('thisDay', { date: day })}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('delivered')} value={formatLiters(dayDeliveredQty)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('extra')} value={formatLiters(dayExtra)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('pending')} value={`${pending.length} (${formatLiters(pendingQty)})`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('subscriptions')} value={formatLiters(dayScheduled)} />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        {t('tillDateThisMonth')}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat
            label={t('deliveredTillDate')}
            value={formatLiters(billing?.monthTotalQuantity ?? '0')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat
            label={t('extraTillDate')}
            value={formatLiters(billing?.monthExtraQuantity ?? '0')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat
            label={t('milk')}
            value={formatLiters(billing?.monthRegularQuantity ?? '0')}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat
            label={t('pendingCash')}
            value={formatCurrency(Number(billing?.outstandingBalance ?? billing?.billTillToday ?? 0))}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat
            label={t('givenThisMonth')}
            value={formatCurrency(Number(billing?.paymentsThisMonth ?? 0))}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat
            label={t('advance')}
            value={formatCurrency(Number(billing?.advanceBalance ?? 0))}
          />
        </Grid>
      </Grid>
      <Button
        variant="outlined"
        sx={{ mb: 3 }}
        disabled={generateBill.isPending}
        onClick={() => generateBill.mutate()}
      >
        {generateBill.isPending ? t('updating') : t('generateBill')}
      </Button>
      {generateBill.isError ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {(generateBill.error as Error).message}
        </Typography>
      ) : null}
      {generateBill.isSuccess ? (
        <Typography color="success.main" sx={{ mb: 2 }}>
          {t('saved')}
        </Typography>
      ) : null}

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        {t('deliveries')} · {day}
      </Typography>
      {dayQuery.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : (
        <Stack spacing={1.5}>
          {dayRows.length === 0 ? (
            <Typography color="text.secondary">
              {t('noDeliveriesOnDay')}
            </Typography>
          ) : (
            dayRows.map((d) => {
              const noMilk = isCustomerNoMilk(d.deliveryNotes, d.status)
              return (
                <Card
                  key={d.id}
                  variant="outlined"
                  sx={
                    noMilk
                      ? { borderColor: 'error.main', bgcolor: 'error.50' }
                      : undefined
                  }
                >
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Chip
                        size="small"
                        label={noMilk ? t('noMilk') : d.status}
                        color={noMilk ? 'error' : 'default'}
                      />
                      <Typography fontWeight={600}>
                        {formatLiters(d.finalDeliveredQuantity ?? d.expectedQuantity ?? d.scheduledQuantity)}{' '}
                        · {d.deliveryShift}
                      </Typography>
                    </Stack>
                    {noMilk ? (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {t('customerDoesNotWantMilk')}
                      </Alert>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })
          )}
        </Stack>
      )}
    </Box>
  )
}
