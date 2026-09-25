import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid2 as Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader } from '../../../components/tables/DataTable'
import { uploadAssetUrl } from '../../../config/env'
import { formatCurrency, formatDate, formatLiters } from '../../../utils/format'
import { customerApi, type CustomerPayment } from '../api/customerApi'

function paymentStatusMeta(status: string, labels: Record<string, string>): {
  label: string
  color: 'default' | 'warning' | 'success' | 'error' | 'info'
} {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return { label: labels.pending, color: 'warning' }
    case 'CONFIRMED':
      return { label: labels.confirm, color: 'success' }
    case 'REJECTED':
      return { label: labels.reject, color: 'error' }
    case 'CANCELLED':
      return { label: labels.cancelled, color: 'default' }
    default:
      return { label: status.replaceAll('_', ' '), color: 'default' }
  }
}

function PaymentRow({ payment }: { payment: CustomerPayment }) {
  const { t } = useTranslation()
  const meta = paymentStatusMeta(payment.status, {
    pending: t('pending'),
    confirm: t('confirm'),
    reject: t('reject'),
    cancelled: t('cancelled'),
  })
  const proofUrl = uploadAssetUrl(payment.proofImageUrl)

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {proofUrl ? (
            <Box
              component="a"
              href={proofUrl}
              target="_blank"
              rel="noreferrer"
              sx={{
                width: 72,
                height: 72,
                borderRadius: 1,
                overflow: 'hidden',
                flexShrink: 0,
                border: 1,
                borderColor: 'divider',
                display: 'block',
              }}
            >
              <Box
                component="img"
                src={proofUrl}
                alt={t('photo')}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 1,
                bgcolor: 'action.hover',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {t('noData')}
              </Typography>
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography fontWeight={700}>{formatCurrency(payment.amount)}</Typography>
              <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {formatDate(payment.paymentDate)} · {payment.paymentMethod}
            </Typography>
            {payment.notes ? (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {payment.notes}
              </Typography>
            ) : null}
            {payment.rejectionNote ? (
              <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                {t('reject')}: {payment.rejectionNote}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function CustomerBillingPage() {
  const { t } = useTranslation()
  const billingQuery = useQuery({
    queryKey: ['customer', 'billing-summary'],
    queryFn: customerApi.billingSummary,
  })
  const paymentsQuery = useQuery({
    queryKey: ['customer', 'payments'],
    queryFn: () => customerApi.myPayments({ limit: 50 }),
  })

  if (billingQuery.isLoading || paymentsQuery.isLoading) {
    return <LoadingState label={t('loading')} />
  }

  if (billingQuery.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(billingQuery.error as Error).message}
        onRetry={() => void billingQuery.refetch()}
      />
    )
  }

  const billing = billingQuery.data!
  const payments = paymentsQuery.data?.data ?? []
  const pendingCash = Number(billing.pendingCashThisMonth ?? 0)

  return (
    <Box>
      <PageHeader
        title={t('billing')}
        subtitle={t('thisMonth')}
        actions={
          <Button component={RouterLink} to="/customer" variant="outlined">
            {t('navHome')}
          </Button>
        }
      />

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        {t('billing')} · {t('datesToday')}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('todaysAmount')}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {formatCurrency(billing.todaysAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('givenThisMonth')}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {formatCurrency(billing.paymentsThisMonth)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('totalRemaining')}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {formatCurrency(billing.billTillToday ?? billing.outstandingBalance)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('extraMilk')} {formatLiters(billing.monthExtraQuantity)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {Number(billing.advanceBalance ?? 0) > 0 ? (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {t('advance')}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {formatCurrency(Number(billing.advanceBalance ?? 0))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : null}
        {pendingCash > 0 ? (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              variant="outlined"
              sx={{ borderColor: 'warning.main', bgcolor: 'rgba(245, 158, 11, 0.06)' }}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {t('pendingCash')}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {formatCurrency(pendingCash)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {billing.pendingCashClaims} · {t('pending')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : null}
      </Grid>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
        {t('payments')}
      </Typography>
      {paymentsQuery.isError ? (
        <ErrorState
          title={t('couldNotLoad')}
          message={(paymentsQuery.error as Error).message}
          onRetry={() => void paymentsQuery.refetch()}
        />
      ) : payments.length === 0 ? (
        <EmptyState
          title={t('noData')}
          description={t('payments')}
          action={
            <Button component={RouterLink} to="/customer" variant="contained">
              {t('reportCashGiven')}
            </Button>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {payments.map((p) => (
            <PaymentRow key={p.id} payment={p} />
          ))}
        </Stack>
      )}
    </Box>
  )
}
