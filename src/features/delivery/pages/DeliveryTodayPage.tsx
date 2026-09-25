import {
  CallOutlined,
  CheckCircleOutline,
  Clear,
  LocalShippingOutlined,
  MapOutlined,
  MoreVert,
  PlaceOutlined,
  Search,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader } from '../../../components/tables/DataTable'
import { quantityLitresSchema } from '../../../lib/validation/common'
import { formatLiters, formatQuantity } from '../../../utils/format'
import { deliveryStaffApi, type TodayDeliveryRow } from '../api/deliveryStaffApi'

type ExtraDialog = { id: string; open: true } | { open: false }
type DeliveredDialog = { id: string; open: true } | { open: false }
type Filter = 'remaining' | 'done' | 'all'

function isOpenStatus(status: string) {
  return status === 'PENDING' || status === 'OUT_FOR_DELIVERY'
}

function canAddExtra(status: string) {
  return isOpenStatus(status) || status === 'DELIVERED'
}

function statusMeta(status: string, labels: Record<string, string>): {
  label: string
  color: 'default' | 'warning' | 'info' | 'success' | 'error'
} {
  switch (status) {
    case 'PENDING':
      return { label: labels.pending, color: 'warning' }
    case 'OUT_FOR_DELIVERY':
      return { label: labels.outForDelivery, color: 'info' }
    case 'DELIVERED':
      return { label: labels.delivered, color: 'success' }
    case 'SKIPPED':
      return { label: labels.skipped, color: 'default' }
    case 'FAILED':
      return { label: labels.failed, color: 'error' }
    default:
      return { label: status.replaceAll('_', ' '), color: 'default' }
  }
}

function formatMobile(mobile?: string | null) {
  if (!mobile) return null
  if (mobile.length === 12 && mobile.startsWith('91')) {
    return `+91 ${mobile.slice(2, 7)} ${mobile.slice(7)}`
  }
  return mobile
}

function formatShift(shift: string) {
  return shift.charAt(0) + shift.slice(1).toLowerCase()
}

function mapsUrl(lat: string, lng: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function routeSortKey(
  d: TodayDeliveryRow,
  staffPos: { lat: number; lng: number } | null,
) {
  const openRank = isOpenStatus(d.status) ? 0 : 1
  const lat = d.latitude ? Number(d.latitude) : NaN
  const lng = d.longitude ? Number(d.longitude) : NaN
  const distance =
    staffPos && !Number.isNaN(lat) && !Number.isNaN(lng)
      ? haversineKm(staffPos.lat, staffPos.lng, lat, lng)
      : Number.POSITIVE_INFINITY
  const sequence = d.deliverySequence ?? Number.MAX_SAFE_INTEGER
  return { openRank, distance, sequence }
}

export function DeliveryTodayPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [extraDialog, setExtraDialog] = useState<ExtraDialog>({ open: false })
  const [deliveredDialog, setDeliveredDialog] = useState<DeliveredDialog>({ open: false })
  const [extraQty, setExtraQty] = useState('0.5')
  const [extraReason, setExtraReason] = useState('')
  const [deliveredQty, setDeliveredQty] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [staffPos, setStaffPos] = useState<{ lat: number; lng: number } | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement
    id: string
  } | null>(null)

  const query = useQuery({
    queryKey: ['delivery-staff', 'today'],
    queryFn: () => deliveryStaffApi.today(),
  })

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStaffPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        /* keep sequence order when location is denied */
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 8_000 },
    )
  }, [])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['delivery-staff'] })
  }

  const actionMutation = useMutation({
    mutationFn: async (input: {
      kind: 'out' | 'delivered' | 'extra' | 'skip' | 'fail'
      id: string
      quantity?: string
      reason?: string
    }) => {
      const { kind, id, quantity, reason } = input
      if (kind === 'out') return deliveryStaffApi.outForDelivery(id)
      if (kind === 'delivered') return deliveryStaffApi.markDelivered(id, quantity)
      if (kind === 'extra') return deliveryStaffApi.addExtra(id, quantity!, reason)
      if (kind === 'skip') return deliveryStaffApi.skip(id)
      return deliveryStaffApi.fail(id)
    },
    onSuccess: async (_data, variables) => {
      setActionError(null)
      setExtraDialog({ open: false })
      setDeliveredDialog({ open: false })
      setMenuAnchor(null)
      // Optimistic status so the row updates before refetch finishes.
      queryClient.setQueryData<TodayDeliveryRow[]>(['delivery-staff', 'today'], (old) => {
        if (!old) return old
        return old.map((row) => {
          if (row.id !== variables.id) return row
          if (variables.kind === 'out') return { ...row, status: 'OUT_FOR_DELIVERY' }
          if (variables.kind === 'delivered') return { ...row, status: 'DELIVERED' }
          if (variables.kind === 'skip') return { ...row, status: 'SKIPPED' }
          if (variables.kind === 'fail') return { ...row, status: 'FAILED' }
          return row
        })
      })
      await invalidate()
    },
    onError: (err) => setActionError((err as Error).message),
  })

  const rows = useMemo(() => query.data ?? [], [query.data])
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ka = routeSortKey(a, staffPos)
      const kb = routeSortKey(b, staffPos)
      if (ka.openRank !== kb.openRank) return ka.openRank - kb.openRank
      if (ka.distance !== kb.distance) return ka.distance - kb.distance
      return ka.sequence - kb.sequence
    })
  }, [rows, staffPos])

  const counts = useMemo(() => {
    const remaining = sortedRows.filter((d) => isOpenStatus(d.status)).length
    const delivered = sortedRows.filter((d) => d.status === 'DELIVERED').length
    const done = sortedRows.length - remaining
    return { remaining, delivered, done, total: sortedRows.length }
  }, [sortedRows])

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sortedRows.filter((d) => {
      if (filter === 'remaining' && !isOpenStatus(d.status)) return false
      if (filter === 'done' && isOpenStatus(d.status)) return false
      if (!q) return true
      const name = (d.customerName ?? '').toLowerCase()
      const mobile = (d.mobileNumber ?? '').toLowerCase()
      const address = (d.address ?? '').toLowerCase()
      return name.includes(q) || mobile.includes(q) || address.includes(q)
    })
  }, [sortedRows, filter, search])

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

  if (!rows.length) {
    return (
      <Box>
        <PageHeader
          title={t('farmAajKiList')}
          subtitle={t('route')}
        />
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('noDeliveryListYet')} · {t('generateList')}
        </Alert>
        <EmptyState
          title={t('noData')}
          description={t('tapGenerateListHint')}
        />
      </Box>
    )
  }

  const openDelivered = (d: TodayDeliveryRow) => {
    const raw = d.expectedQuantity ?? d.scheduledQuantity ?? ''
    const qty = formatQuantity(raw)
    setDeliveredQty(qty === '—' ? '' : qty)
    setDeliveredDialog({ open: true, id: d.id })
  }

  const openExtra = (id: string) => {
    setExtraQty('0.5')
    setExtraReason('')
    setExtraDialog({ open: true, id })
  }

  const openMenu = (event: MouseEvent<HTMLElement>, id: string) => {
    setMenuAnchor({ el: event.currentTarget, id })
  }

  const progressPct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0
  const extraQtyCheck = quantityLitresSchema(t).safeParse(extraQty)
  const deliveredQtyCheck = quantityLitresSchema(t).safeParse(deliveredQty)

  return (
    <Box>
      <PageHeader
        title={t('farmAajKiList')}
        subtitle={`${t('remaining')} · ${t('done')}`}
      />

      <Paper
        variant="outlined"
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={1.5}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            fullWidth
            size="small"
            sx={{
              bgcolor: 'background.paper',
              '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label={t('clear')}
                    onClick={() => setSearch('')}
                    edge="end"
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            onChange={(_, value: Filter | null) => {
              if (value) setFilter(value)
            }}
            aria-label={t('filter')}
            sx={{
              flexWrap: 'wrap',
              gap: 1,
              '& .MuiToggleButtonGroup-grouped': {
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '999px !important',
                px: 1.75,
                bgcolor: 'background.paper',
                color: 'text.primary',
                '&.Mui-selected': {
                  bgcolor: 'background.paper',
                  color: 'primary.dark',
                  borderColor: 'primary.main',
                  fontWeight: 700,
                },
                '&.Mui-selected:hover': {
                  bgcolor: 'background.paper',
                },
              },
            }}
          >
            <ToggleButton value="all">{t('all')} ({counts.total})</ToggleButton>
            <ToggleButton value="remaining">{t('remaining')} ({counts.remaining})</ToggleButton>
            <ToggleButton value="done">{t('done')} ({counts.done})</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          mb: 2.5,
          p: 2,
          borderRadius: 2,
          background:
            'linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(255,255,255,0.9) 55%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              {t('route')}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {counts.done} / {counts.total} · {t('done')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {counts.remaining} {t('remaining')} · {counts.delivered} {t('delivered')}
            </Typography>
            <Box
              sx={{
                mt: 1.5,
                height: 8,
                borderRadius: 999,
                bgcolor: 'divider',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${progressPct}%`,
                  height: '100%',
                  bgcolor: 'primary.main',
                  transition: 'width 0.25s ease',
                }}
              />
            </Box>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <SummaryPill label={t('pending')} value={counts.remaining} />
            <SummaryPill label={t('delivered')} value={counts.delivered} tone="success" />
          </Stack>
        </Stack>
      </Paper>

      {actionError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      ) : null}

      {visibleRows.length === 0 ? (
        <EmptyState
          title={
            search.trim()
              ? t('noData')
              : filter === 'remaining'
                ? t('done')
                : t('emptyDefault')
          }
          description={
            search.trim()
              ? t('noData')
              : filter === 'remaining'
                ? t('done')
                : t('filter')
          }
          action={
            search.trim() ? (
              <Button variant="outlined" onClick={() => setSearch('')}>
                {t('clear')}
              </Button>
            ) : filter !== 'all' ? (
              <Button variant="outlined" onClick={() => setFilter('all')}>
                {t('all')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {visibleRows.map((d, index) => {
            const meta = statusMeta(d.status, {
              pending: t('pending'),
              outForDelivery: t('outForDelivery'),
              delivered: t('delivered'),
              skipped: t('skipped'),
              failed: t('failed'),
            })
            const qty = formatLiters(d.expectedQuantity ?? d.scheduledQuantity)
            const extra =
              d.staffExtraQuantity && Number(d.staffExtraQuantity) > 0
                ? formatQuantity(d.staffExtraQuantity)
                : null
            const mobile = formatMobile(d.mobileNumber)
            const stopNo = sortedRows.findIndex((row) => row.id === d.id) + 1
            const hasPin = Boolean(d.latitude && d.longitude)
            const distanceKm =
              staffPos && hasPin
                ? haversineKm(
                    staffPos.lat,
                    staffPos.lng,
                    Number(d.latitude),
                    Number(d.longitude),
                  )
                : null

            return (
              <Paper
                key={d.id}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  borderColor: d.status === 'OUT_FOR_DELIVERY' ? 'primary.light' : 'divider',
                  boxShadow:
                    d.status === 'OUT_FOR_DELIVERY'
                      ? '0 0 0 1px rgba(15, 118, 110, 0.15)'
                      : 'none',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'auto 1fr',
                      md: 'auto 1fr auto',
                    },
                    gap: { xs: 1.5, md: 2 },
                    p: { xs: 1.75, sm: 2 },
                    alignItems: 'start',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor:
                        d.status === 'DELIVERED'
                          ? 'success.main'
                          : d.status === 'OUT_FOR_DELIVERY'
                            ? 'primary.main'
                            : 'secondary.main',
                      color: 'common.white',
                      fontWeight: 800,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {d.status === 'DELIVERED' ? (
                      <CheckCircleOutline fontSize="small" />
                    ) : d.status === 'OUT_FOR_DELIVERY' ? (
                      <LocalShippingOutlined fontSize="small" />
                    ) : (
                      stopNo || index + 1
                    )}
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography fontWeight={700} sx={{ fontSize: '1.05rem' }}>
                        {d.customerName ?? t('customer')}
                      </Typography>
                      <Chip
                        label={meta.label}
                        size="small"
                        color={meta.color}
                        variant="outlined"
                      />
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={2}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 1 }}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        {qty}
                        <Typography component="span" variant="body2" color="text.secondary">
                          {' '}
                          · {formatShift(d.deliveryShift)}
                        </Typography>
                      </Typography>
                      {extra ? (
                        <Chip
                          size="small"
                          label={`+${extra} L ${t('extra')}`}
                          color="primary"
                          variant="outlined"
                        />
                      ) : null}
                      {d.amount ? (
                        <Typography variant="body2" color="text.secondary">
                          ₹{d.amount}
                        </Typography>
                      ) : null}
                    </Stack>

                    <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                      <Stack direction="row" spacing={0.75} alignItems="flex-start">
                        <PlaceOutlined
                          sx={{ fontSize: 16, mt: '2px', color: 'text.secondary' }}
                        />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {d.address || t('address')}
                          </Typography>
                          {hasPin ? (
                            <Typography variant="caption" color="text.secondary">
                              {t('map')} · {Number(d.latitude).toFixed(5)},{' '}
                              {Number(d.longitude).toFixed(5)}
                              {distanceKm != null
                                ? ` · ~${distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} away`
                                : ''}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="warning.dark">
                              {t('noData')} · {t('map')}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {hasPin ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<MapOutlined />}
                            component="a"
                            href={mapsUrl(d.latitude!, d.longitude!)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('open')} {t('map')}
                          </Button>
                        ) : null}
                        {mobile && d.mobileNumber ? (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<CallOutlined />}
                            href={`tel:${d.mobileNumber}`}
                            component="a"
                          >
                            {mobile}
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Box>

                  {isOpenStatus(d.status) || d.status === 'DELIVERED' ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{
                        gridColumn: { xs: '1 / -1', md: 'auto' },
                        justifyContent: { xs: 'stretch', md: 'flex-end' },
                        alignItems: 'center',
                        pt: { xs: 0.5, md: 0 },
                      }}
                    >
                      {d.status === 'PENDING' ? (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={actionMutation.isPending}
                          onClick={() => actionMutation.mutate({ kind: 'out', id: d.id })}
                          sx={{ flex: { xs: 1, sm: 'none' } }}
                        >
                          {t('outForDelivery')}
                        </Button>
                      ) : null}
                      {isOpenStatus(d.status) ? (
                        <Button
                          size="small"
                          variant="contained"
                          disabled={actionMutation.isPending}
                          onClick={() => openDelivered(d)}
                          sx={{ flex: { xs: 1, sm: 'none' } }}
                        >
                          {t('delivered')}
                        </Button>
                      ) : null}
                      {canAddExtra(d.status) ? (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={actionMutation.isPending}
                          onClick={() => openExtra(d.id)}
                        >
                          {t('add')} {t('extra')}
                        </Button>
                      ) : null}
                      {isOpenStatus(d.status) ? (
                        <IconButton
                          size="small"
                          aria-label={t('more')}
                          disabled={actionMutation.isPending}
                          onClick={(e) => openMenu(e, d.id)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      ) : null}
                    </Stack>
                  ) : null}
                </Box>
              </Paper>
            )
          })}
        </Stack>
      )}

      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          disabled={actionMutation.isPending}
          onClick={() => {
            if (!menuAnchor) return
            actionMutation.mutate({ kind: 'skip', id: menuAnchor.id })
          }}
        >
          {t('skip')}
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={actionMutation.isPending}
          onClick={() => {
            if (!menuAnchor) return
            actionMutation.mutate({ kind: 'fail', id: menuAnchor.id })
          }}
          sx={{ color: 'error.main' }}
        >
          {t('fail')}
        </MenuItem>
      </Menu>

      <Dialog
        open={extraDialog.open}
        onClose={() => setExtraDialog({ open: false })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t('extraMilk')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('quantityL')}
              value={extraQty}
              onChange={(e) => setExtraQty(e.target.value)}
              placeholder="0.5"
              fullWidth
              autoFocus
              error={Boolean(extraQty) && !extraQtyCheck.success}
              helperText={
                extraQty && !extraQtyCheck.success
                  ? extraQtyCheck.error.issues[0].message
                  : undefined
              }
            />
            <TextField
              label={t('notesOptional')}
              value={extraReason}
              onChange={(e) => setExtraReason(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtraDialog({ open: false })}>{t('cancel')}</Button>
          <Button
            variant="contained"
            disabled={actionMutation.isPending || !extraQtyCheck.success}
            onClick={() => {
              if (!extraDialog.open || !extraQtyCheck.success) return
              actionMutation.mutate({
                kind: 'extra',
                id: extraDialog.id,
                quantity: extraQty.trim(),
                reason: extraReason.trim() || undefined,
              })
            }}
          >
            {t('add')} {t('extra')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deliveredDialog.open}
        onClose={() => setDeliveredDialog({ open: false })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t('markDelivered')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('quantityL')}
              value={deliveredQty}
              onChange={(e) => setDeliveredQty(e.target.value)}
              helperText={
                deliveredQty && !deliveredQtyCheck.success
                  ? deliveredQtyCheck.error.issues[0].message
                  : t('enterValidQuantity')
              }
              error={Boolean(deliveredQty) && !deliveredQtyCheck.success}
              fullWidth
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveredDialog({ open: false })}>{t('cancel')}</Button>
          <Button
            variant="contained"
            disabled={actionMutation.isPending || !deliveredQtyCheck.success}
            onClick={() => {
              if (!deliveredDialog.open || !deliveredQtyCheck.success) return
              actionMutation.mutate({
                kind: 'delivered',
                id: deliveredDialog.id,
                quantity: deliveredQty.trim(),
              })
            }}
          >
            {t('confirm')} · {t('delivered')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function SummaryPill({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'success'
}) {
  return (
    <Box
      sx={{
        px: 1.75,
        py: 1,
        borderRadius: 2,
        bgcolor: tone === 'success' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(15, 23, 42, 0.04)',
        border: 1,
        borderColor: tone === 'success' ? 'rgba(5, 150, 105, 0.25)' : 'divider',
        minWidth: 88,
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
        {value}
      </Typography>
    </Box>
  )
}
