import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader } from '../../../components/tables/DataTable'
import { isApiError } from '../../../lib/api/client'
import { refreshQueries } from '../../../lib/query/refreshQueries'
import { formatCurrency, formatLiters } from '../../../utils/format'
import { uploadAssetUrl } from '../../../config/env'
import {
  customerApi,
  type CreateServiceRequestPayload,
  type DeliveryScheduleType,
  type DeliveryShift,
  type FarmSearchResult,
} from '../api/customerApi'

function deliveryShiftKey(shift: DeliveryShift) {
  return shift.toLowerCase()
}

function scheduleKey(schedule: DeliveryScheduleType) {
  if (schedule === 'EVERY_DAY') return 'day'
  if (schedule === 'ALTERNATE_DAYS') return 'period'
  if (schedule === 'WEEKLY') return 'thisWeek'
  return 'period'
}

const scheduleOptions: DeliveryScheduleType[] = [
  'EVERY_DAY',
  'ALTERNATE_DAYS',
  'WEEKLY',
]

function productShifts(product?: { availableShifts: DeliveryShift[] }) {
  const shifts = product?.availableShifts?.length ? product.availableShifts : (['MORNING'] as DeliveryShift[])
  return [...shifts].sort(
    (a, b) =>
      ['MORNING', 'AFTERNOON', 'EVENING'].indexOf(a) -
      ['MORNING', 'AFTERNOON', 'EVENING'].indexOf(b),
  )
}

export function CustomerFarmDetailPage() {
  const { t } = useTranslation()
  const { farmId } = useParams<{ farmId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const stateFarm = (location.state as { farm?: FarmSearchResult } | null)?.farm

  const farmQuery = useQuery({
    queryKey: ['customer', 'farm', farmId],
    queryFn: () => customerApi.getPublicFarm(farmId!),
    enabled: Boolean(farmId),
  })

  const products = useMemo(() => {
    if (farmQuery.data?.products?.length) return farmQuery.data.products
    if (stateFarm?.products?.length) return stateFarm.products
    return []
  }, [farmQuery.data, stateFarm])

  const addressesQuery = useQuery({
    queryKey: ['customer', 'addresses'],
    queryFn: customerApi.addresses,
  })

  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [deliveryShift, setDeliveryShift] = useState<DeliveryShift>('MORNING')
  const [scheduleType, setScheduleType] = useState<DeliveryScheduleType>('EVERY_DAY')
  const [addressId, setAddressId] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [instructions, setInstructions] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState(false)

  const selectedProduct = products.find((p) => p.id === productId)
  const shiftOptions = productShifts(selectedProduct)

  useEffect(() => {
    if (!shiftOptions.length) return
    if (!shiftOptions.includes(deliveryShift)) {
      setDeliveryShift(shiftOptions[0])
    }
  }, [productId, shiftOptions, deliveryShift])

  const requestMutation = useMutation({
    mutationFn: (payload: CreateServiceRequestPayload) => customerApi.createServiceRequest(payload),
    onSuccess: () => {
      setSuccess(true)
      setFormError(null)
      void queryClient.invalidateQueries({ queryKey: ['customer', 'service-requests'] })
    },
    onError: (err) =>
      setFormError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  const reviewMutation = useMutation({
    mutationFn: () =>
      customerApi.submitFarmReview(farmId!, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      }),
    onSuccess: async () => {
      setReviewError(null)
      setReviewSuccess(true)
      setReviewComment('')
      await refreshQueries(queryClient, [['customer', 'farm', farmId!]])
    },
    onError: (err) =>
      setReviewError(isApiError(err) ? err.message : t('somethingWentWrong')),
  })

  if (farmQuery.isLoading) return <LoadingState label={t('loading')} />
  if (farmQuery.isError || !farmQuery.data) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(farmQuery.error as Error)?.message}
        onRetry={() => void farmQuery.refetch()}
      />
    )
  }

  const farm = farmQuery.data

  const onSubmit = () => {
    if (!productId || !addressId || !quantity.trim() || !startDate) {
      setFormError(t('fieldRequired'))
      return
    }
    requestMutation.mutate({
      farmId: farm.id,
      addressId,
      productId,
      quantity: quantity.trim(),
      deliveryShift,
      scheduleType,
      preferredStartDate: startDate,
      deliveryInstructions: instructions.trim() || undefined,
    })
  }

  return (
    <Box>
      <PageHeader
        title={farm.name}
        subtitle={[farm.area, farm.city, farm.state, farm.postalCode].filter(Boolean).join(', ')}
        actions={
          <Button variant="text" onClick={() => navigate(-1)}>
            {t('back')} · {t('search')}
          </Button>
        }
      />

      {farm.businessName ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {farm.businessName}
        </Typography>
      ) : null}
      {farm.description ? <Typography sx={{ mb: 1 }}>{farm.description}</Typography> : null}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {(farm.reviewCount ?? 0) > 0
          ? `${farm.averageRating?.toFixed(1)} ★ · ${farm.reviewCount} reviews`
          : t('noData')}
      </Typography>

      {(farm.images?.length ?? 0) > 0 ? (
        <Stack direction="row" spacing={1} sx={{ mb: 3, overflowX: 'auto', pb: 1 }}>
          {farm.images!.map((img) => (
            <Box
              key={img.id}
              component="img"
              src={uploadAssetUrl(img.url) ?? undefined}
              alt=""
              sx={{ width: 240, height: 150, objectFit: 'cover', borderRadius: 2, flex: '0 0 auto' }}
            />
          ))}
        </Stack>
      ) : null}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            {t('products')}
          </Typography>
          {products.length === 0 ? (
            <Typography color="text.secondary">
              {t('noData')}
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {products.map((p) => (
                <Stack
                  key={p.id}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Typography fontWeight={600}>{p.name}</Typography>
                  <Chip size="small" label={p.milkType} />
                  <Typography variant="body2">{formatCurrency(p.currentRatePerLitre)}/L</Typography>
                  <Typography variant="body2" color="text.secondary">
                    min {formatLiters(p.minimumQuantity)}
                    {p.maximumQuantity ? ` · max ${formatLiters(p.maximumQuantity)}` : ''} ·{' '}
                    {p.availableShifts.map((shift) => t(deliveryShiftKey(shift))).join(', ')}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 1 }}>
            {t('reviews')}
          </Typography>
          {(farm.reviews?.length ?? 0) === 0 ? (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {t('noData')}
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {farm.reviews!.map((r) => (
                <Box key={r.id}>
                  <Typography fontWeight={600}>
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </Typography>
                  {r.comment ? <Typography variant="body2">{r.comment}</Typography> : null}
                </Box>
              ))}
            </Stack>
          )}

          <Typography fontWeight={600} sx={{ mb: 1 }}>
            {t('reviews')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t('active')} · {t('connected')}
          </Typography>
          {reviewSuccess ? (
            <Alert severity="success" sx={{ mb: 1.5 }}>
              {t('success')}
            </Alert>
          ) : null}
          {reviewError ? (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {reviewError}
            </Alert>
          ) : null}
          <Stack spacing={1.5} sx={{ maxWidth: 420 }}>
            <TextField
              select
              label={t('reviews')}
              size="small"
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <MenuItem key={n} value={n}>
                  {n} ★
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('notesOptional')}
              size="small"
              multiline
              minRows={2}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <Button
              variant="outlined"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate()}
              sx={{ alignSelf: 'flex-start' }}
            >
              {reviewMutation.isPending ? t('loading') : t('submit')}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            {t('requestMilk')}
          </Typography>

          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('success')} · {t('navInbox')}
            </Alert>
          ) : null}
          {formError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          ) : null}

          {!addressesQuery.data?.length ? (
            <Alert severity="info">
              {t('add')} {t('address')}
            </Alert>
          ) : products.length === 0 ? (
            <Alert severity="info">{t('noData')}</Alert>
          ) : (
            <Stack spacing={2.5} sx={{ maxWidth: 560 }}>
              {selectedProduct ? (
                <Alert severity="success" icon={false} sx={{ py: 1.25 }}>
                  <Typography fontWeight={700}>{selectedProduct.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProduct.milkType.charAt(0) +
                      selectedProduct.milkType.slice(1).toLowerCase()}{' '}
                    · {formatCurrency(selectedProduct.currentRatePerLitre)}/L · min{' '}
                    {formatLiters(selectedProduct.minimumQuantity)}
                  </Typography>
                </Alert>
              ) : null}
              <TextField
                select
                label={t('products')}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                fullWidth
                required
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} · {formatCurrency(p.currentRatePerLitre)}/L
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t('deliverTo')}
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                fullWidth
                required
              >
                {addressesQuery.data.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.label} — {a.area}, {a.city} {a.postalCode}
                  </MenuItem>
                ))}
              </TextField>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('quantityL')}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  fullWidth
                  required
                  sx={{ flex: 1 }}
                />
                {shiftOptions.length === 1 ? (
                  <TextField
                    label={t('shift')}
                    value={t(deliveryShiftKey(shiftOptions[0]))}
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                  />
                ) : (
                  <TextField
                    select
                    label={t('shift')}
                    value={deliveryShift}
                    onChange={(e) => setDeliveryShift(e.target.value as DeliveryShift)}
                    fullWidth
                    sx={{ flex: 1 }}
                  >
                    {shiftOptions.map((shift) => (
                      <MenuItem key={shift} value={shift}>
                        {t(deliveryShiftKey(shift))}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Stack>
              <TextField
                select
                label={t('period')}
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as DeliveryScheduleType)}
                fullWidth
                helperText={
                  scheduleType === 'WEEKLY'
                    ? t('thisWeek')
                    : undefined
                }
              >
                {scheduleOptions.map((s) => (
                  <MenuItem key={s} value={s}>
                    {t(scheduleKey(s))}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={t('from')}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label={t('notes')}
                placeholder={t('notesOptional')}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
              <Button
                variant="contained"
                onClick={onSubmit}
                disabled={requestMutation.isPending}
                sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minWidth: 180 }}
              >
                {requestMutation.isPending ? t('loading') : t('submitRequest')}
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
