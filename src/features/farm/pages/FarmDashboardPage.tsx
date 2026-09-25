import {
  PeopleOutline,
  RadioButtonUnchecked,
  StorefrontOutlined,
  LocalShippingOutlined,
  MoveToInboxOutlined,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader } from '../../../components/tables/DataTable'
import { DELIVERY_STAFF_ENABLED } from '../../../config/featureFlags'
import { useAuth } from '../../../lib/auth/useAuth'
import { formatCurrency, formatDate, formatLiters } from '../../../utils/format'
import { farmApi } from '../api/farmApi'

function dateIso(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function StatCard({
  label,
  value,
  to,
}: {
  label: string
  value: string | number
  to?: string
}) {
  const navigate = useNavigate()
  const body = (
    <CardContent>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
    </CardContent>
  )

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      {to ? (
        <CardActionArea
          onClick={() => navigate(to)}
          sx={{ height: '100%', alignItems: 'stretch' }}
        >
          {body}
        </CardActionArea>
      ) : (
        body
      )}
    </Card>
  )
}

interface ChecklistItem {
  key: string
  label: string
  done: boolean
  to: string
}

export function FarmDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const todayIso = useMemo(() => dateIso(new Date()), [])
  const yesterdayIso = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return dateIso(d)
  }, [])
  const weekFromIso = useMemo(() => {
    const d = new Date()
    const day = d.getDay() // 0 Sun
    const diff = day === 0 ? 6 : day - 1
    d.setDate(d.getDate() - diff)
    return dateIso(d)
  }, [])
  const monthFromIso = useMemo(() => `${todayIso.slice(0, 7)}-01`, [todayIso])
  const yearFromIso = useMemo(() => `${todayIso.slice(0, 4)}-01-01`, [todayIso])
  const monthsAgoIso = (months: number) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const day = d.getDate()
    d.setMonth(d.getMonth() - months)
    // Clamp day if month rolled (e.g. Mar 31 → Feb)
    if (d.getDate() < day) d.setDate(0)
    return dateIso(d)
  }
  const threeMonthsIso = useMemo(() => monthsAgoIso(3), [todayIso])
  const sixMonthsIso = useMemo(() => monthsAgoIso(6), [todayIso])

  const [fromDate, setFromDate] = useState(todayIso)
  const [toDate, setToDate] = useState(todayIso)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [customDraftFrom, setCustomDraftFrom] = useState(todayIso)
  const [customDraftTo, setCustomDraftTo] = useState(todayIso)

  const periodPresets = useMemo(
    () =>
      [
        { id: 'today', label: t('datesToday'), from: todayIso, to: todayIso },
        { id: 'yesterday', label: t('datesYesterday'), from: yesterdayIso, to: yesterdayIso },
        { id: 'week', label: t('thisWeek'), from: weekFromIso, to: todayIso },
        { id: 'month', label: t('thisMonth'), from: monthFromIso, to: todayIso },
        { id: '3m', label: `3 ${t('thisMonth')}`, from: threeMonthsIso, to: todayIso },
        { id: '6m', label: `6 ${t('thisMonth')}`, from: sixMonthsIso, to: todayIso },
        { id: 'year', label: t('period'), from: yearFromIso, to: todayIso },
      ] as const,
    [
      todayIso,
      yesterdayIso,
      weekFromIso,
      monthFromIso,
      threeMonthsIso,
      sixMonthsIso,
      yearFromIso,
      t,
    ],
  )

  const selectedPresetId =
    periodPresets.find((p) => p.from === fromDate && p.to === toDate)?.id ?? null
  const isToday = selectedPresetId === 'today'
  const isSingleDay = fromDate === toDate
  const rangeLabel =
    isSingleDay
      ? formatDate(fromDate)
      : `${formatDate(fromDate)} – ${formatDate(toDate)}`

  const setRange = (from: string, to: string) => {
    setFromDate(from)
    setToDate(to)
    setPeriodOpen(false)
  }

  const applyCustomRange = () => {
    const from = customDraftFrom <= customDraftTo ? customDraftFrom : customDraftTo
    const to = customDraftFrom <= customDraftTo ? customDraftTo : customDraftFrom
    setRange(from, to)
  }

  const dashboardQuery = useQuery({
    queryKey: ['farm', 'dashboard', fromDate, toDate],
    queryFn: () => farmApi.myDashboard({ from: fromDate, to: toDate }),
  })
  const todayQuery = useQuery({
    queryKey: ['farm', 'dashboard', 'today-metrics', fromDate, toDate],
    queryFn: () => farmApi.farmTodayMetrics({ from: fromDate, to: toDate }),
    retry: 1,
  })

  if (dashboardQuery.isLoading) return <LoadingState label={t('loading')} />
  if (dashboardQuery.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(dashboardQuery.error as Error).message}
        onRetry={() => void dashboardQuery.refetch()}
      />
    )
  }

  const dashboard = dashboardQuery.data!
  const { farm, counts, onboardingChecklist } = dashboard
  const money = dashboard.money ?? {
    madeToday: '0',
    madeThisWeek: '0',
    madeThisMonth: '0',
    collectedToday: '0',
    collectedThisWeek: '0',
    collectedThisMonth: '0',
    toCollect: counts.outstandingBalance ?? '0',
    advanceBalance: counts.advanceBalance ?? '0',
  }
  const madeInRange = money.madeInRange ?? money.madeToday
  const collectedInRange = money.collectedInRange ?? money.collectedToday
  const advanceHeld = Number(money.advanceBalance ?? counts.advanceBalance ?? 0)
  const today = todayQuery.data

  const checklist: ChecklistItem[] = [
    {
      key: 'profile',
      label: `1. ${t('farmProfile')}`,
      done: onboardingChecklist.profileComplete,
      to: '/farm/profile',
    },
    {
      key: 'serviceArea',
      label: `2. ${t('serviceAreas')}`,
      done: onboardingChecklist.hasServiceArea,
      to: '/farm/service-areas',
    },
    {
      key: 'product',
      label: `3. ${t('navMilkProducts')}`,
      done: onboardingChecklist.hasProduct,
      to: '/farm/products',
    },
    {
      key: 'rate',
      label: `4. ${t('rate')}`,
      done: onboardingChecklist.hasProduct,
      to: '/farm/products',
    },
    // DELIVERY_STAFF_ENABLED: invite staff + assign-staff checklist items
    ...(DELIVERY_STAFF_ENABLED
      ? [
          {
            key: 'staff',
            label: `5. ${t('invite')} ${t('staff')} (${t('optional')})`,
            done: onboardingChecklist.hasStaff,
            to: '/farm/staff',
          },
        ]
      : []),
    {
      key: 'customers',
      label: `${DELIVERY_STAFF_ENABLED ? '6' : '5'}. ${t('invite')} ${t('customers')}`,
      done:
        counts.pendingCustomerInvitations > 0 ||
        counts.connections > 0 ||
        counts.pendingServiceRequests > 0,
      to: '/farm/requests',
    },
    ...(DELIVERY_STAFF_ENABLED
      ? [
          {
            key: 'subscriptions',
            label: `7. ${t('navDeliveryStaff')}`,
            done: counts.connections > 0,
            to: '/farm/customers',
          },
        ]
      : []),
    {
      key: 'today',
      label: `${DELIVERY_STAFF_ENABLED ? '8' : '6'}. ${t('generateList')}`,
      done: counts.todayDeliveries > 0,
      to: '/farm/today',
    },
  ]

  const primaryActions = [
    {
      label: t('farmAajKiList'),
      hint: t('markDelivered'),
      to: '/farm/today',
      icon: <LocalShippingOutlined />,
    },
    {
      label: t('customers'),
      hint: `${counts.connections} ${t('connected')}`,
      to: '/farm/customers',
      icon: <PeopleOutline />,
    },
    {
      label: t('requests'),
      hint:
        counts.pendingServiceRequests > 0
          ? `${counts.pendingServiceRequests} ${t('pending')}`
          : t('navCustomerRequests'),
      to: '/farm/requests',
      icon: <MoveToInboxOutlined />,
    },
    {
      label: t('farmSetupTile'),
      hint: `${t('products')}, ${t('serviceAreas')} & ${t('profile')}`,
      to: '/farm/profile',
      icon: <StorefrontOutlined />,
    },
  ]

  return (
    <Box>
      <PageHeader
        title={`${t('welcome')}, ${user?.name ?? t('customer')}`}
        subtitle={`${farm.name} · ${t('farmConsole')}`}
      />

      {!onboardingChecklist.isApproved ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('pending')} · {t('farmProfile')}, {t('serviceAreas')}, {t('products')}
        </Alert>
      ) : null}

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
        {t('farmPaisaTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
        {t('period')}
      </Typography>
      <Button
        variant="outlined"
        onClick={() => {
          setCustomDraftFrom(fromDate)
          setCustomDraftTo(toDate)
          setPeriodOpen(true)
        }}
        sx={{ mb: 1.5, justifyContent: 'space-between', minWidth: 280 }}
        endIcon={<span aria-hidden>▾</span>}
      >
        <Box textAlign="left">
          <Typography variant="body2" fontWeight={700} component="span">
            {selectedPresetId
              ? periodPresets.find((p) => p.id === selectedPresetId)?.label
              : t('period')}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {rangeLabel}
          </Typography>
        </Box>
      </Button>
      <Dialog open={periodOpen} onClose={() => setPeriodOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('select')} {t('period')}</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <List disablePadding>
            {periodPresets.map((p) => (
              <ListItemButton
                key={p.id}
                selected={selectedPresetId === p.id}
                onClick={() => setRange(p.from, p.to)}
              >
                <ListItemText primary={p.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              {t('period')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
              <TextField
                label={t('from')}
                type="date"
                size="small"
                fullWidth
                value={customDraftFrom}
                onChange={(e) => {
                  const next = e.target.value
                  if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) return
                  setCustomDraftFrom(next)
                }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={t('to')}
                type="date"
                size="small"
                fullWidth
                value={customDraftTo}
                onChange={(e) => {
                  const next = e.target.value
                  if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) return
                  setCustomDraftTo(next)
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: todayIso }}
              />
            </Stack>
            <Button variant="contained" fullWidth onClick={applyCustomRange}>
              {t('apply')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPeriodOpen(false)}>{t('close')}</Button>
        </DialogActions>
      </Dialog>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t('period')} · {rangeLabel}
      </Typography>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
            {isToday ? t('todaysMilk') : `${t('milk')} · ${rangeLabel}`}
          </Typography>
          {todayQuery.isError ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('couldNotLoad')} · {t('milk')}
            </Alert>
          ) : (
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              {[
                {
                  label: t('subscriptions'),
                  value: formatLiters(today?.scheduledQuantity),
                  to: '/farm/today',
                },
                {
                  label: t('extra'),
                  value: formatLiters(today?.totalExtraQuantity),
                  to: '/farm/today',
                  hint: today
                    ? DELIVERY_STAFF_ENABLED
                      ? `${t('customer')} ${formatLiters(today.customerExtraQuantity)} · ${t('staff')} ${formatLiters(today.staffExtraQuantity)}`
                      : `${t('customer')} ${formatLiters(today.customerExtraQuantity)}`
                    : undefined,
                },
                {
                  label: t('delivered'),
                  value: formatLiters(today?.totalDeliveredQuantity),
                  to: '/farm/today',
                },
                {
                  label: `${t('pending')} / ${t('done')}`,
                  value: today ? `${today.pendingCount} / ${today.deliveredCount}` : '—',
                  to: '/farm/today',
                },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 6, sm: 3 }}>
                  <Box
                    component={RouterLink}
                    to={item.to}
                    sx={{
                      display: 'block',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      textDecoration: 'none',
                      color: 'inherit',
                      height: '100%',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      {item.label}
                    </Typography>
                    <Typography fontWeight={700} sx={{ mt: 0.5, fontSize: '1rem' }}>
                      {todayQuery.isLoading ? '…' : item.value}
                    </Typography>
                    {item.hint ? (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                        {item.hint}
                      </Typography>
                    ) : null}
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}

          <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mt: 0.5 }}>
            {t('farmToCollect')}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
            {formatCurrency(money.toCollect)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, mb: 2 }}>
            {t('outstanding')} · {t('delivered')} {t('milk')}
          </Typography>

          {advanceHeld > 0 ? (
            <>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {t('advance')}
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                {formatCurrency(advanceHeld)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.5, mb: 2.5 }}
              >
                {t('advance')} · {t('collected')}
              </Typography>
            </>
          ) : null}

          {isSingleDay ? (
            <>
              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
                {t('farmMadeSection')}
              </Typography>
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                {(
                  [
                    [t('datesToday'), madeInRange],
                    [t('thisWeek'), money.madeThisWeek],
                    [t('thisMonth'), money.madeThisMonth],
                  ] as const
                ).map(([label, value]) => (
                  <Grid key={`made-${label}`} size={{ xs: 4 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        textAlign: 'center',
                        height: '100%',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        {label}
                      </Typography>
                      <Typography fontWeight={700} sx={{ mt: 0.5, fontSize: '0.95rem' }}>
                        {formatCurrency(value)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
                {t('farmCollectedSection')}
              </Typography>
              <Grid container spacing={1.5}>
                {(
                  [
                    [t('datesToday'), collectedInRange],
                    [t('thisWeek'), money.collectedThisWeek],
                    [t('thisMonth'), money.collectedThisMonth],
                  ] as const
                ).map(([label, value]) => (
                  <Grid key={`cash-${label}`} size={{ xs: 4 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        textAlign: 'center',
                        height: '100%',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        {label}
                      </Typography>
                      <Typography fontWeight={700} sx={{ mt: 0.5, fontSize: '0.95rem' }}>
                        {formatCurrency(value)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {t('farmMadeSection')}
                </Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                  {formatCurrency(madeInRange)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  {t('farmCollectedSection')}
                </Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                  {formatCurrency(collectedInRange)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {primaryActions.map((action) => (
          <Button
            key={action.to}
            component={RouterLink}
            to={action.to}
            variant="contained"
            size="large"
            startIcon={action.icon}
            sx={{
              justifyContent: 'flex-start',
              py: 1.75,
              px: 2.5,
              textTransform: 'none',
              fontSize: '1.05rem',
              fontWeight: 700,
            }}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography component="span" fontWeight={700} display="block">
                {action.label}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {action.hint}
              </Typography>
            </Box>
          </Button>
        ))}
      </Stack>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        {t('details')}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {DELIVERY_STAFF_ENABLED ? (
          <Grid size={{ xs: 6, md: 4 }}>
            <StatCard label={t('navDeliveryStaff')} value={counts.staff} to="/farm/staff" />
          </Grid>
        ) : null}
        <Grid size={{ xs: 6, md: DELIVERY_STAFF_ENABLED ? 4 : 6 }}>
          <StatCard
            label={t('connectedCustomers')}
            value={counts.connections}
            to="/farm/customers"
          />
        </Grid>
        <Grid size={{ xs: 6, md: DELIVERY_STAFF_ENABLED ? 4 : 6 }}>
          <StatCard
            label={`${t('edit')} ${t('deliveries')}`}
            value={today?.editedDeliveryCount ?? 0}
            to="/farm/today"
          />
        </Grid>
      </Grid>

      {checklist.some((item) => !item.done) ? (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                {t('settings')}
              </Typography>
              <List dense disablePadding>
                {checklist
                  .filter((item) => !item.done)
                  .map((item) => (
                  <ListItem key={item.key} disablePadding>
                    <ListItemButton component={RouterLink} to={item.to} sx={{ borderRadius: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <RadioButtonUnchecked fontSize="small" color="disabled" />
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>
                {t('farm')} {t('status')}
              </Typography>
              <Chip
                label={farm.status.replace('_', ' ')}
                color={farm.status === 'ACTIVE' ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                {t('status')} · {new Date(farm.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('serviceAreas')}: {counts.serviceAreas} · {t('products')}: {counts.products}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      ) : (
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography fontWeight={700}>{t('farm')} {t('status')}</Typography>
            <Chip
              size="small"
              label={farm.status.replace('_', ' ')}
              color={farm.status === 'ACTIVE' ? 'success' : 'warning'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t('serviceAreas')}: {counts.serviceAreas} · {t('products')}: {counts.products} · {t('customers')}:{' '}
            {counts.connections}
          </Typography>
        </CardContent>
      </Card>
      )}
    </Box>
  )
}
