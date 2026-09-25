import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { DELIVERY_STAFF_ENABLED } from '../../../config/featureFlags'
import { formatDate, formatLiters } from '../../../utils/format'
import { farmApi } from '../api/farmApi'
import { farmDeliveriesApi } from '../api/farmDeliveriesApi'
import { useMyFarm } from '../hooks/useMyFarm'
import type { ConnectionSubscription, CreateManagedCustomerPayload } from '../types/farm'

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function FarmConnectedCustomersPage() {
  const { t } = useTranslation()
  const { farmId, isLoading: farmLoading } = useMyFarm()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<CreateManagedCustomerPayload>({
    name: '',
    mobileNumber: '',
    address: '',
    milkType: 'COW',
    quantity: '1',
    ratePerLitre: '60',
    deliveryShift: 'MORNING',
    startDate: todayIso(),
  })

  const query = useQuery({
    queryKey: ['farm', farmId, 'customers'],
    queryFn: () => farmApi.customers(farmId!, { limit: 50 }),
    enabled: Boolean(farmId),
  })

  const staffQuery = useQuery({
    queryKey: ['farm', farmId, 'members'],
    queryFn: () => farmApi.members(farmId!),
    enabled: Boolean(farmId) && DELIVERY_STAFF_ENABLED,
  })

  const assignMutation = useMutation({
    mutationFn: ({
      subscriptionId,
      assignedDeliveryUserId,
    }: {
      subscriptionId: string
      assignedDeliveryUserId: string | null
    }) => farmDeliveriesApi.assignDelivery(subscriptionId, assignedDeliveryUserId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['farm', farmId, 'customers'] })
      await queryClient.refetchQueries({ queryKey: ['farm', farmId, 'customers'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: () =>
      farmApi.createManagedCustomer(farmId!, {
        name: form.name.trim(),
        mobileNumber: form.mobileNumber?.trim() || undefined,
        address: form.address?.trim() || undefined,
        milkType: form.milkType,
        quantity: form.quantity.trim(),
        ratePerLitre: form.ratePerLitre.trim(),
        deliveryShift: form.deliveryShift,
        startDate: form.startDate,
      }),
    onSuccess: async () => {
      setAddOpen(false)
      setForm({
        name: '',
        mobileNumber: '',
        address: '',
        milkType: 'COW',
        quantity: '1',
        ratePerLitre: '60',
        deliveryShift: 'MORNING',
        startDate: todayIso(),
      })
      await queryClient.invalidateQueries({ queryKey: ['farm', farmId, 'customers'] })
      await queryClient.invalidateQueries({ queryKey: ['farm', 'deliveries', 'today'] })
      await queryClient.refetchQueries({ queryKey: ['farm', farmId, 'customers'] })
    },
  })

  if (farmLoading || query.isLoading) return <LoadingState label={t('loading')} />
  if (query.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const connections = query.data?.data ?? []
  const staff = (staffQuery.data ?? []).filter((m) => m.memberRole === 'DELIVERY_STAFF')

  return (
    <Box>
      <PageHeader
        title={t('customers')}
        subtitle={
          DELIVERY_STAFF_ENABLED
            ? `${t('connected')} · ${t('managed')} · ${t('navDeliveryStaff')}`
            : `${t('connected')} · ${t('managed')} · ${t('customers')}`
        }
        actions={
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/farm/invitations" variant="outlined">
              {t('invite')}
            </Button>
            <Button component={RouterLink} to="/farm/today" variant="outlined">
              {t('farmAajKiList')}
            </Button>
            <Button variant="contained" onClick={() => setAddOpen(true)}>
              {t('add')} {t('customer')}
            </Button>
          </Stack>
        }
      />

      {assignMutation.isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(assignMutation.error as Error).message}
        </Alert>
      ) : null}

      {connections.length === 0 ? (
        <EmptyState
          title={t('noData')}
          description={t('customers')}
          action={
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => setAddOpen(true)}>
                {t('add')} {t('customer')}
              </Button>
              <Button component={RouterLink} to="/farm/requests" variant="outlined">
                {t('view')} {t('requests')}
              </Button>
              <Button component={RouterLink} to="/farm/invitations" variant="outlined">
                {t('invite')}
              </Button>
            </Stack>
          }
        />
      ) : (
        <Stack spacing={2}>
          {connections.map((connection) => {
            const managed =
              connection.source === 'MANAGED' || !connection.customerUserId
            const displayName =
              connection.name ?? connection.customerUser?.name ?? t('customer')
            const displayMobile =
              connection.mobileNumber ?? connection.customerUser?.mobileNumber ?? '—'
            return (
              <Card key={connection.id} variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={1}
                    >
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography fontWeight={700}>{displayName}</Typography>
                          {managed ? <Chip label={t('managed')} size="small" /> : null}
                          <StatusChip status={connection.status} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {displayMobile}
                          {!managed && connection.connectedAt
                            ? ` · ${t('connected')} ${formatDate(connection.connectedAt)}`
                            : managed
                              ? ` · ${t('managed')}`
                              : ''}
                        </Typography>
                      </Box>
                    </Stack>

                    {(connection.subscriptions?.length ?? 0) === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t('noData')} · {t('subscription')}
                      </Typography>
                    ) : (
                      connection.subscriptions!.map((sub: ConnectionSubscription) => (
                        <Stack
                          key={sub.id}
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          justifyContent="space-between"
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                          }}
                        >
                          <Typography variant="body2">
                            {sub.milkType} · {formatLiters(sub.defaultQuantity)} ·{' '}
                            {sub.deliveryShift} · ₹{sub.ratePerLitre}/L
                          </Typography>
                          {DELIVERY_STAFF_ENABLED ? (
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                              <InputLabel id={`assign-${sub.id}`}>{t('navDeliveryStaff')}</InputLabel>
                              <Select
                                labelId={`assign-${sub.id}`}
                                label={t('navDeliveryStaff')}
                                value={sub.assignedDeliveryUserId ?? ''}
                                disabled={assignMutation.isPending}
                                onChange={(e) => {
                                  const value = e.target.value as string
                                  assignMutation.mutate({
                                    subscriptionId: sub.id,
                                    assignedDeliveryUserId: value === '' ? null : value,
                                  })
                                }}
                              >
                                <MenuItem value="">{t('farm')} / {t('none')}</MenuItem>
                                {staff.map((member) => (
                                  <MenuItem key={member.userId} value={member.userId}>
                                    {member.user?.name ?? member.userId}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {t('deliver')}
                            </Typography>
                          )}
                        </Stack>
                      ))
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}

      <Dialog open={addOpen} onClose={() => !createMutation.isPending && setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('add')} {t('customer')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('managed')} · {t('farmAajKiList')}
          </Typography>
          <Stack spacing={2}>
            <TextField
              label={t('name')}
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label={`${t('mobileNumber')} (${t('optional')})`}
              value={form.mobileNumber}
              onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value }))}
              fullWidth
            />
            <TextField
              label={`${t('address')} (${t('optional')})`}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label={t('milkType')}
              value={form.milkType}
              onChange={(e) => setForm((f) => ({ ...f, milkType: e.target.value }))}
              fullWidth
            >
              <MenuItem value="COW">{t('milk')}</MenuItem>
              <MenuItem value="BUFFALO">{t('milk')}</MenuItem>
            </TextField>
            <TextField
              label={t('quantityL')}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              fullWidth
            />
            <TextField
              label={t('ratePerLitre')}
              value={form.ratePerLitre}
              onChange={(e) => setForm((f) => ({ ...f, ratePerLitre: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label={t('shift')}
              value={form.deliveryShift}
              onChange={(e) => setForm((f) => ({ ...f, deliveryShift: e.target.value }))}
              fullWidth
            >
              <MenuItem value="MORNING">{t('morning')}</MenuItem>
              <MenuItem value="EVENING">{t('evening')}</MenuItem>
            </TextField>
            <TextField
              label={t('from')}
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            {createMutation.isError ? (
              <Alert severity="error">{(createMutation.error as Error).message}</Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={createMutation.isPending} onClick={() => setAddOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={
              createMutation.isPending ||
              !form.name.trim() ||
              !form.quantity.trim() ||
              !form.ratePerLitre.trim()
            }
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? t('saving') : t('add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
