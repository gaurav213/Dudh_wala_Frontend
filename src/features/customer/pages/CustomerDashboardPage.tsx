import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader } from '../../../components/tables/DataTable'
import { useAuth } from '../../../lib/auth/useAuth'
import { isApiError } from '../../../lib/api/client'
import { formatCurrency, formatLiters } from '../../../utils/format'
import { refreshQueries } from '../../../lib/query/refreshQueries'
import {
  deliveryShiftLabel,
  deliveryStatusLabel,
} from '../../../i18n/deliveryLabels'
import {
  customerApi,
  type CustomerDelivery,
  type DeliveryIssueType,
} from '../api/customerApi'

function todayIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function expectedQty(d: CustomerDelivery) {
  const total =
    Number(d.scheduledQuantity || d.quantity || 0) +
    Number(d.customerExtraQuantity || 0) +
    Number(d.staffExtraQuantity || 0)
  return total.toFixed(3)
}

export function CustomerDashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [claimOpen, setClaimOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeType, setDisputeType] = useState<DeliveryIssueType>('NOT_RECEIVED')
  const [disputeNotes, setDisputeNotes] = useState('')
  const [disputeDeliveryId, setDisputeDeliveryId] = useState<string | null>(null)
  const [deliveryActionError, setDeliveryActionError] = useState<string | null>(null)

  const addressesQuery = useQuery({
    queryKey: ['customer', 'addresses'],
    queryFn: customerApi.addresses,
  })
  const requestsQuery = useQuery({
    queryKey: ['customer', 'service-requests'],
    queryFn: () => customerApi.myServiceRequests({ status: 'PENDING', limit: 50 }),
  })
  const invitationsQuery = useQuery({
    queryKey: ['customer', 'invitations'],
    queryFn: customerApi.myInvitations,
  })
  const billingQuery = useQuery({
    queryKey: ['customer', 'billing-summary'],
    queryFn: customerApi.billingSummary,
  })
  const deliveriesQuery = useQuery({
    queryKey: ['customer', 'deliveries', 'recent'],
    queryFn: () => customerApi.myDeliveries({ page: 1, limit: 60 }),
  })

  const todaysDelivery = useMemo(() => {
    const today = todayIso()
    const list = deliveriesQuery.data?.data ?? []
    return list.find((d) => d.deliveryDate === today) ?? null
  }, [deliveriesQuery.data])

  const invalidateDeliveries = async () => {
    await refreshQueries(queryClient, [
      ['customer', 'deliveries'],
      ['customer', 'billing-summary'],
    ])
  }

  const claimMutation = useMutation({
    mutationFn: () =>
      customerApi.claimCash({
        amount: Number(amount).toFixed(2),
        proof: proof!,
        notes: notes.trim() || undefined,
        clientReferenceId: crypto.randomUUID(),
      }),
    onSuccess: () => {
      setClaimOpen(false)
      setAmount('')
      setNotes('')
      setProof(null)
      setClaimError(null)
      void queryClient.invalidateQueries({ queryKey: ['customer', 'billing-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['customer', 'payments'] })
    },
    onError: (err) => {
      setClaimError(isApiError(err) ? err.message : (err as Error).message)
    },
  })

  const disputeMutation = useMutation({
    mutationFn: () =>
      customerApi.reportDeliveryIssue(
        disputeDeliveryId!,
        disputeType,
        disputeNotes.trim() || undefined,
      ),
    onSuccess: async () => {
      setDisputeOpen(false)
      setDisputeNotes('')
      setDisputeDeliveryId(null)
      setDeliveryActionError(null)
      await invalidateDeliveries()
    },
    onError: (err) => {
      setDeliveryActionError(isApiError(err) ? err.message : (err as Error).message)
    },
  })

  const skipMutation = useMutation({
    mutationFn: (deliveryId: string) => customerApi.skipToday(deliveryId),
    onSuccess: async () => {
      setDeliveryActionError(null)
      await invalidateDeliveries()
    },
    onError: (err) => {
      setDeliveryActionError(isApiError(err) ? err.message : (err as Error).message)
    },
  })

  if (addressesQuery.isLoading) return <LoadingState label={t('loading')} />

  const addressCount = addressesQuery.data?.length ?? 0
  const defaultAddress = addressesQuery.data?.find((a) => a.isDefault)
  const hasAddress = addressCount > 0
  const pendingRequests = requestsQuery.data?.data.length ?? 0
  const pendingInvitations = invitationsQuery.data?.filter((i) => i.status === 'PENDING').length ?? 0
  const billing = billingQuery.data
  const pendingCash = Number(billing?.pendingCashThisMonth ?? 0)
  const remaining = billing?.billTillToday ?? billing?.outstandingBalance ?? '0'
  const advance = Number(billing?.advanceBalance ?? 0)

  function openClaim() {
    setClaimError(null)
    setClaimOpen(true)
  }

  function submitClaim() {
    setClaimError(null)
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      setClaimError(t('enterValidAmount'))
      return
    }
    if (!proof) {
      setClaimError(t('photoProofRequired'))
      return
    }
    claimMutation.mutate()
  }

  function openDispute(id: string) {
    setDisputeDeliveryId(id)
    setDisputeType('NOT_RECEIVED')
    setDisputeNotes('')
    setDeliveryActionError(null)
    setDisputeOpen(true)
  }

  return (
    <Box>
      <PageHeader
        title={`${t('welcome')}, ${user?.name ?? t('customer')}`}
        subtitle={t('customerShellTitle')}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={openClaim}>
              {t('reportCashGiven')}
            </Button>
            <Button component={RouterLink} to="/customer/billing" variant="outlined">
              {t('navBilling')}
            </Button>
          </Stack>
        }
      />

      <Card variant="outlined" sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <CardContent>
          <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 0.8 }}>
            {t('todaysMilk')}
          </Typography>
          {deliveriesQuery.isLoading ? (
            <Typography sx={{ mt: 1 }}>{t('loading')}</Typography>
          ) : !todaysDelivery ? (
            <Typography sx={{ mt: 1 }}>{t('noDeliveriesOnDay')}</Typography>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {todaysDelivery.status === 'SKIPPED' &&
              !(todaysDelivery.deliveryNotes ?? todaysDelivery.notes ?? '').includes(
                'Customer:',
              ) ? (
                <Alert
                  severity="error"
                  sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}
                >
                  {t('farmNotDeliveringBody')}
                </Alert>
              ) : null}
              {todaysDelivery.status === 'DELIVERED' &&
              Number(todaysDelivery.finalDeliveredQuantity ?? todaysDelivery.quantity ?? 0) +
                0.0005 <
                Number(todaysDelivery.scheduledQuantity || 0) +
                  Number(todaysDelivery.customerExtraQuantity || 0) ? (
                <Alert severity="warning">
                  {t('lessMilk')} ·{' '}
                  {formatLiters(
                    todaysDelivery.finalDeliveredQuantity ??
                      todaysDelivery.quantity ??
                      '0',
                  )}
                </Alert>
              ) : null}
              <Typography variant="h4" fontWeight={700}>
                {formatLiters(expectedQty(todaysDelivery))}
                <Typography component="span" variant="body1" sx={{ ml: 1, opacity: 0.85 }}>
                  · {deliveryShiftLabel(t, todaysDelivery.deliveryShift)} ·{' '}
                  {deliveryStatusLabel(t, todaysDelivery.status)}
                </Typography>
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('amount')} {formatCurrency(todaysDelivery.amount ?? 0)}
                {todaysDelivery.confirmationStatus &&
                todaysDelivery.confirmationStatus !== 'NOT_CONFIRMED'
                  ? ` · ${deliveryStatusLabel(t, todaysDelivery.confirmationStatus)}`
                  : ''}
              </Typography>
              {deliveryActionError ? (
                <Alert severity="error" sx={{ color: 'text.primary' }}>
                  {deliveryActionError}
                </Alert>
              ) : null}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {todaysDelivery &&
                (todaysDelivery.status === 'PENDING' ||
                  todaysDelivery.status === 'OUT_FOR_DELIVERY') ? (
                  <Button
                    variant="outlined"
                    color="inherit"
                    disabled={skipMutation.isPending || disputeMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          t('skipMilkConfirmBody', { date: t('datesToday') }),
                        )
                      ) {
                        skipMutation.mutate(todaysDelivery.id)
                      }
                    }}
                  >
                    {skipMutation.isPending ? t('skipping') : t('noMilkTodayBtn')}
                  </Button>
                ) : null}
                {todaysDelivery ? (
                  <Button
                    variant="outlined"
                    color="inherit"
                    disabled={disputeMutation.isPending || skipMutation.isPending}
                    onClick={() => openDispute(todaysDelivery.id)}
                  >
                    {t('warning')}
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('todaysAmount')}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {formatCurrency(billing?.todaysAmount ?? 0)}
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
              <Typography variant="h4" fontWeight={700}>
                {formatCurrency(billing?.paymentsThisMonth ?? 0)}
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
              <Typography variant="h4" fontWeight={700}>
                {formatCurrency(remaining)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('extraMilk')} {formatLiters(billing?.monthExtraQuantity ?? '0')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {advance > 0 ? (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {t('advance')}
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {formatCurrency(advance)}
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
                <Typography variant="h4" fontWeight={700}>
                  {formatCurrency(pendingCash)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {billing?.pendingCashClaims ?? 0} · {t('pending')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : null}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('navAddresses')}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {addressCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('defaultLabel')} {t('address')}
              </Typography>
              <Typography variant="h6" fontWeight={700} noWrap>
                {defaultAddress ? `${defaultAddress.area}, ${defaultAddress.city}` : t('none')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('pending')} {t('requests')}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {pendingRequests}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={
              pendingInvitations > 0
                ? { borderColor: 'primary.main', bgcolor: 'rgba(15, 118, 110, 0.06)' }
                : undefined
            }
          >
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {t('pending')} {t('invitations')}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {pendingInvitations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {pendingInvitations > 0 ? (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          action={
            <Button component={RouterLink} to="/customer/requests" color="inherit" size="small">
              {t('open')} {t('navInbox')}
            </Button>
          }
        >
          {pendingInvitations} · {t('navFarmInvitations')}
        </Alert>
      ) : null}

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
        {t('more')}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
        <Button
          component={RouterLink}
          to={hasAddress ? '/customer/farms' : '/customer/addresses'}
          variant="contained"
        >
          {hasAddress ? t('findFarms') : `${t('add')} ${t('address')}`}
        </Button>
        <Button component={RouterLink} to="/customer/addresses" variant="outlined">
          {addressCount ? `${t('manage')} ${t('address')}` : `${t('add')} ${t('address')}`}
        </Button>
        <Button component={RouterLink} to="/customer/requests" variant="outlined">
          {t('navInbox')}
        </Button>
        <Button component={RouterLink} to="/customer/billing" variant="outlined">
          {t('billing')} & {t('payments')}
        </Button>
        <Button component={RouterLink} to="/customer/profile" variant="text">
          {t('view')} {t('profile')}
        </Button>
      </Stack>

      {!hasAddress ? (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography fontWeight={700} gutterBottom>
              {t('continueAction')}
            </Typography>
            <Typography color="text.secondary">
              {t('add')} {t('address')} · {t('findFarms')}
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={claimOpen} onClose={() => !claimMutation.isPending && setClaimOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('reportCashGiven')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('addCashPhoto')}
            </Typography>
            {claimError ? <Alert severity="error">{claimError}</Alert> : null}
            <TextField
              label={t('amountInr')}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ min: 0, step: '0.01' }}
              fullWidth
              required
            />
            <TextField
              label={t('notesOptional')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <Button variant="outlined" component="label">
              {proof ? proof.name : t('photo')}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setProof(e.target.files?.[0] ?? null)}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimOpen(false)} disabled={claimMutation.isPending}>
            {t('cancel')}
          </Button>
          <Button variant="contained" onClick={submitClaim} disabled={claimMutation.isPending}>
            {claimMutation.isPending ? t('loading') : t('submit')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={disputeOpen}
        onClose={() => !disputeMutation.isPending && setDisputeOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('warning')} · {t('delivery')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label={t('details')}
              value={disputeType}
              onChange={(e) => setDisputeType(e.target.value as DeliveryIssueType)}
              fullWidth
            >
              <MenuItem value="NOT_RECEIVED">{t('failed')}</MenuItem>
              <MenuItem value="WRONG_QUANTITY">{t('quantityL')}</MenuItem>
              <MenuItem value="WRONG_PRODUCT">{t('products')}</MenuItem>
              <MenuItem value="QUALITY_ISSUE">{t('warning')}</MenuItem>
              <MenuItem value="OTHER">{t('more')}</MenuItem>
            </TextField>
            <TextField
              label={t('notesOptional')}
              value={disputeNotes}
              onChange={(e) => setDisputeNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisputeOpen(false)} disabled={disputeMutation.isPending}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={disputeMutation.isPending || !disputeDeliveryId}
            onClick={() => disputeMutation.mutate()}
          >
            {disputeMutation.isPending ? t('loading') : t('submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
