import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { isApiError } from '../../../lib/api/client'
import { refreshQueries } from '../../../lib/query/refreshQueries'
import { quantityLitresSchema, rateSchema } from '../../../lib/validation/common'
import {
  formatCurrency,
  formatDate,
  formatLiters,
  formatQuantity,
} from '../../../utils/format'
import { farmApi } from '../api/farmApi'
import { useMyFarm } from '../hooks/useMyFarm'
import type {
  CreateProductPayload,
  DeliveryShift,
  FarmProduct,
  MilkType,
  UpdateProductPayload,
} from '../types/farm'

const MILK_TYPES: MilkType[] = ['COW', 'BUFFALO', 'MIXED', 'TONED', 'OTHER']
const SHIFTS: DeliveryShift[] = ['MORNING', 'AFTERNOON', 'EVENING']

function deliveryShiftKey(shift: DeliveryShift) {
  return shift.toLowerCase()
}

interface ProductFormState {
  name: string
  milkType: MilkType
  description: string
  currentRatePerLitre: string
  minimumQuantity: string
  maximumQuantity: string
  availableShifts: DeliveryShift[]
}

const emptyForm: ProductFormState = {
  name: '',
  milkType: 'COW',
  description: '',
  currentRatePerLitre: '',
  minimumQuantity: '0.5',
  maximumQuantity: '',
  availableShifts: ['MORNING'],
}

export function FarmProductsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { farmId, isLoading: farmLoading } = useMyFarm()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FarmProduct | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  const [rateDialogProduct, setRateDialogProduct] = useState<FarmProduct | null>(null)
  const [rateForm, setRateForm] = useState({ ratePerLitre: '', effectiveFrom: '' })
  const [rateError, setRateError] = useState<string | null>(null)

  const [historyProduct, setHistoryProduct] = useState<FarmProduct | null>(null)

  const query = useQuery({
    queryKey: ['farm', farmId, 'products'],
    queryFn: () => farmApi.products(farmId!),
    enabled: Boolean(farmId),
  })

  const historyQuery = useQuery({
    queryKey: ['farm', farmId, 'products', historyProduct?.id, 'rate-history'],
    queryFn: () => farmApi.rateHistory(farmId!, historyProduct!.id),
    enabled: Boolean(farmId && historyProduct),
  })

  const invalidate = () =>
    refreshQueries(queryClient, [['farm', farmId, 'products']])

  const createMutation = useMutation({
    mutationFn: (payload: CreateProductPayload) => farmApi.createProduct(farmId!, payload),
    onSuccess: async () => {
      await invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProductPayload) =>
      farmApi.updateProduct(farmId!, editing!.id, payload),
    onSuccess: async () => {
      await invalidate()
      closeDialog()
    },
    onError: (err) => setFormError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => farmApi.deleteProduct(farmId!, id),
    onSuccess: () => void invalidate(),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => farmApi.activateProduct(farmId!, id),
    onSuccess: () => void invalidate(),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => farmApi.deactivateProduct(farmId!, id),
    onSuccess: () => void invalidate(),
  })

  const changeRateMutation = useMutation({
    mutationFn: () =>
      farmApi.changeRate(farmId!, rateDialogProduct!.id, {
        ratePerLitre: rateForm.ratePerLitre,
        effectiveFrom: rateForm.effectiveFrom || undefined,
      }),
    onSuccess: async () => {
      await invalidate()
      setRateDialogProduct(null)
      setRateError(null)
    },
    onError: (err) => setRateError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (product: FarmProduct) => {
    setEditing(product)
    setForm({
      name: product.name,
      milkType: product.milkType,
      description: product.description ?? '',
      currentRatePerLitre: product.currentRatePerLitre,
      minimumQuantity: formatQuantity(product.minimumQuantity),
      maximumQuantity: product.maximumQuantity
        ? formatQuantity(product.maximumQuantity)
        : '',
      availableShifts: product.availableShifts,
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setFormError(null)
  }

  const toggleShift = (shift: DeliveryShift) => {
    setForm((f) => ({
      ...f,
      availableShifts: f.availableShifts.includes(shift)
        ? f.availableShifts.filter((s) => s !== shift)
        : [...f.availableShifts, shift],
    }))
  }

  const onSave = () => {
    if (!form.name.trim() || !form.currentRatePerLitre.trim() || !form.minimumQuantity.trim()) {
      setFormError(t('fieldRequired'))
      return
    }
    if (form.availableShifts.length === 0) {
      setFormError(t('required'))
      return
    }
    if (!editing) {
      const rateCheck = rateSchema(t).safeParse(form.currentRatePerLitre)
      if (!rateCheck.success) {
        setFormError(`${t('ratePerLitre')}: ${rateCheck.error.issues[0].message}`)
        return
      }
    }
    const minQtyCheck = quantityLitresSchema(t).safeParse(form.minimumQuantity)
    if (!minQtyCheck.success) {
      setFormError(`${t('quantityL')}: ${minQtyCheck.error.issues[0].message}`)
      return
    }
    if (form.maximumQuantity.trim()) {
      const maxQtyCheck = quantityLitresSchema(t).safeParse(form.maximumQuantity)
      if (!maxQtyCheck.success) {
        setFormError(`${t('quantityL')}: ${maxQtyCheck.error.issues[0].message}`)
        return
      }
      if (maxQtyCheck.data < minQtyCheck.data) {
        setFormError(t('enterValidQuantity'))
        return
      }
    }
    if (editing) {
      const payload: UpdateProductPayload = {
        name: form.name.trim(),
        milkType: form.milkType,
        description: form.description.trim() || undefined,
        minimumQuantity: form.minimumQuantity.trim(),
        maximumQuantity: form.maximumQuantity.trim() || undefined,
        availableShifts: form.availableShifts,
      }
      updateMutation.mutate(payload)
    } else {
      const payload: CreateProductPayload = {
        name: form.name.trim(),
        milkType: form.milkType,
        description: form.description.trim() || undefined,
        currentRatePerLitre: form.currentRatePerLitre.trim(),
        minimumQuantity: form.minimumQuantity.trim(),
        maximumQuantity: form.maximumQuantity.trim() || undefined,
        availableShifts: form.availableShifts,
      }
      createMutation.mutate(payload)
    }
  }

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

  const products = query.data ?? []

  return (
    <Box>
      <PageHeader
        title={t('navMilkProducts')}
        subtitle={`${t('products')} · ${t('rate')} · ${t('shift')}`}
        actions={
          <Button variant="contained" onClick={openCreate}>
            {t('add')} {t('products')}
          </Button>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title={t('noData')}
          description={t('navMilkProducts')}
          action={
            <Button variant="contained" onClick={openCreate}>
              {t('add')} {t('products')}
            </Button>
          }
        />
      ) : (
        <Stack spacing={2}>
          {products.map((product) => (
            <Card key={product.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography fontWeight={700}>{product.name}</Typography>
                      <StatusChip status={product.isAvailable ? 'ACTIVE' : 'INACTIVE'} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {product.milkType} · {formatCurrency(product.currentRatePerLitre)}/L · min{' '}
                      {formatLiters(product.minimumQuantity)}
                      {product.maximumQuantity
                        ? ` · max ${formatLiters(product.maximumQuantity)}`
                        : ''}{' '}
                      · {product.availableShifts.map((shift) => t(deliveryShiftKey(shift))).join(', ')}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button size="small" onClick={() => openEdit(product)}>
                      {t('edit')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setRateDialogProduct(product)
                        setRateForm({ ratePerLitre: product.currentRatePerLitre, effectiveFrom: '' })
                        setRateError(null)
                      }}
                    >
                      {t('update')} {t('rate')}
                    </Button>
                    <Button size="small" onClick={() => setHistoryProduct(product)}>
                      {t('rate')} · {t('history')}
                    </Button>
                    {product.isAvailable ? (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => deactivateMutation.mutate(product.id)}
                        disabled={deactivateMutation.isPending}
                      >
                        {t('cancel')}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        color="success"
                        onClick={() => activateMutation.mutate(product.id)}
                        disabled={activateMutation.isPending}
                      >
                        {t('active')}
                      </Button>
                    )}
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        if (window.confirm(`${t('delete')} "${product.name}"?`)) {
                          deleteMutation.mutate(product.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {t('delete')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('edit') : t('add')} {t('products')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              label={`${t('products')} ${t('name')}`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              select
              label={t('milkType')}
              value={form.milkType}
              onChange={(e) => setForm((f) => ({ ...f, milkType: e.target.value as MilkType }))}
              fullWidth
            >
              {MILK_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('details')}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label={t('ratePerLitre')}
              value={form.currentRatePerLitre}
              onChange={(e) => setForm((f) => ({ ...f, currentRatePerLitre: e.target.value }))}
              fullWidth
              required
              disabled={Boolean(editing)}
              helperText={editing ? `${t('update')} ${t('rate')}` : undefined}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('quantityL')}
                value={form.minimumQuantity}
                onChange={(e) => setForm((f) => ({ ...f, minimumQuantity: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label={t('quantityL')}
                value={form.maximumQuantity}
                onChange={(e) => setForm((f) => ({ ...f, maximumQuantity: e.target.value }))}
                fullWidth
              />
            </Stack>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {t('shift')}
              </Typography>
              <Stack direction="row" spacing={2}>
                {SHIFTS.map((shift) => (
                  <FormControlLabel
                    key={shift}
                    control={
                      <Checkbox
                        checked={form.availableShifts.includes(shift)}
                        onChange={() => toggleShift(shift)}
                      />
                    }
                    label={t(deliveryShiftKey(shift))}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t('cancel')}</Button>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? t('saving') : t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(rateDialogProduct)}
        onClose={() => setRateDialogProduct(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('update')} {t('rate')} — {rateDialogProduct?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {rateError ? <Alert severity="error">{rateError}</Alert> : null}
            <TextField
              label={t('ratePerLitre')}
              value={rateForm.ratePerLitre}
              onChange={(e) => setRateForm((f) => ({ ...f, ratePerLitre: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label={t('from')}
              type="date"
              value={rateForm.effectiveFrom}
              onChange={(e) => setRateForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText={t('datesToday')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRateDialogProduct(null)}>{t('cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => {
              const rateCheck = rateSchema(t).safeParse(rateForm.ratePerLitre)
              if (!rateCheck.success) {
                setRateError(rateCheck.error.issues[0].message)
                return
              }
              changeRateMutation.mutate()
            }}
            disabled={changeRateMutation.isPending}
          >
            {changeRateMutation.isPending ? t('saving') : `${t('update')} ${t('rate')}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(historyProduct)}
        onClose={() => setHistoryProduct(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('rate')} · {t('history')} — {historyProduct?.name}</DialogTitle>
        <DialogContent>
          {historyQuery.isLoading ? (
            <LoadingState label={t('loading')} />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('rate')}</TableCell>
                  <TableCell>{t('from')}</TableCell>
                  <TableCell>{t('to')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(historyQuery.data ?? []).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatCurrency(entry.ratePerLitre)}</TableCell>
                    <TableCell>{formatDate(entry.effectiveFrom)}</TableCell>
                    <TableCell>{entry.effectiveTo ? formatDate(entry.effectiveTo) : t('active')}</TableCell>
                  </TableRow>
                ))}
                {!historyQuery.data?.length ? (
                  <TableRow>
                    <TableCell colSpan={3}>{t('noData')}</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryProduct(null)}>{t('close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
