import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader } from '../../../components/tables/DataTable'
import { formatCurrency } from '../../../utils/format'
import { customerApi, type DeliveryShift, type MilkType } from '../api/customerApi'

const MILK_TYPES: MilkType[] = ['COW', 'BUFFALO', 'MIXED', 'TONED', 'OTHER']
const SHIFTS: DeliveryShift[] = ['MORNING', 'AFTERNOON', 'EVENING']

function deliveryShiftKey(shift: DeliveryShift) {
  return shift.toLowerCase()
}

export function CustomerFarmsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const addressesQuery = useQuery({
    queryKey: ['customer', 'addresses'],
    queryFn: customerApi.addresses,
  })

  const [addressId, setAddressId] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('')
  const [milkType, setMilkType] = useState<MilkType | ''>('')
  const [deliveryShift, setDeliveryShift] = useState<DeliveryShift | ''>('')
  const [submitted, setSubmitted] = useState<{
    addressId: string
    postalCode: string
    area: string
    city: string
    milkType: MilkType | ''
    deliveryShift: DeliveryShift | ''
  } | null>(null)

  const addresses = addressesQuery.data
  useEffect(() => {
    if (!addresses?.length || addressId) return
    const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0]
    setAddressId(defaultAddress.id)
    setSubmitted({
      addressId: defaultAddress.id,
      postalCode: '',
      area: '',
      city: '',
      milkType: '',
      deliveryShift: '',
    })
  }, [addresses, addressId])

  const query = useQuery({
    queryKey: ['customer', 'farms', submitted],
    queryFn: () =>
      customerApi.searchFarms({
        addressId: submitted!.addressId || undefined,
        postalCode: submitted!.postalCode || undefined,
        area: submitted!.area || undefined,
        city: submitted!.city || undefined,
        milkType: submitted!.milkType || undefined,
        deliveryShift: submitted!.deliveryShift || undefined,
        includeDiagnostics: true,
        page: 1,
        limit: 20,
      }),
    enabled: Boolean(submitted),
  })

  const onSearch = () => {
    setSubmitted({
      addressId,
      postalCode: postalCode.trim(),
      area: area.trim(),
      city: city.trim(),
      milkType,
      deliveryShift,
    })
  }

  if (addressesQuery.isLoading) return <LoadingState label={t('loading')} />

  if (!addressesQuery.data?.length) {
    return (
      <Box>
        <PageHeader title={t('findFarms')} subtitle={t('search')} />
        <EmptyState
          title={`${t('add')} ${t('address')}`}
          description={t('findFarms')}
          action={
            <Button component={RouterLink} to="/customer/addresses" variant="contained">
              {t('add')} {t('address')}
            </Button>
          }
        />
      </Box>
    )
  }

  const results = query.data?.data ?? []
  const diagnostics = query.data?.meta.diagnostics?.reasons ?? []

  return (
    <Box>
      <PageHeader
        title={t('findFarms')}
        subtitle={`${t('search')} · ${t('filter')}`}
      />

      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          label={t('address')}
          size="small"
          value={addressId}
          onChange={(e) => setAddressId(e.target.value)}
          fullWidth
        >
          {addressesQuery.data.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.label} — {a.area}, {a.city} {a.postalCode}
              {a.isDefault ? ` (${t('defaultLabel')})` : ''}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label={t('postalCode')}
            size="small"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            fullWidth
          />
          <TextField
            label={t('address')}
            size="small"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            fullWidth
          />
          <TextField
            label={t('city')}
            size="small"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            fullWidth
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label={t('milkType')}
            size="small"
            value={milkType}
            onChange={(e) => setMilkType(e.target.value as MilkType | '')}
            fullWidth
          >
            <MenuItem value="">{t('all')}</MenuItem>
            {MILK_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t('shift')}
            size="small"
            value={deliveryShift}
            onChange={(e) => setDeliveryShift(e.target.value as DeliveryShift | '')}
            fullWidth
          >
            <MenuItem value="">{t('all')}</MenuItem>
            {SHIFTS.map((shift) => (
              <MenuItem key={shift} value={shift}>
                {t(deliveryShiftKey(shift))}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={onSearch} sx={{ minWidth: 140 }}>
            {t('search')}
          </Button>
        </Stack>
      </Stack>

      {query.isLoading ? <LoadingState label={t('loading')} /> : null}
      {query.isError ? (
        <ErrorState
          title={t('couldNotLoad')}
          message={(query.error as Error).message}
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {!query.isLoading && !query.isError ? (
        <Stack spacing={2}>
          {results.map((farm) => (
            <Card key={farm.id} variant="outlined">
              <CardActionArea
                onClick={() => navigate(`/customer/farms/${farm.id}`, { state: { farm } })}
              >
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography fontWeight={700}>{farm.name}</Typography>
                    {farm.serviceAreaMatch && farm.serviceAreaMatch !== 'NONE' ? (
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={farm.serviceAreaMatch.replace('_', ' ')}
                      />
                    ) : null}
                    <Chip
                      size="small"
                      color={farm.connection?.connected ? 'success' : 'default'}
                      variant={farm.connection?.connected ? 'filled' : 'outlined'}
                      label={farm.connection?.connected ? t('connected') : t('none')}
                    />
                  </Stack>
                  {farm.connection?.connected ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {t('connected')}:{' '}
                      {(farm.connection.products?.length
                        ? farm.connection.products.map((p) => p.name || p.milkType).join(', ')
                        : t('subscription'))}
                    </Typography>
                  ) : null}
                  {farm.description ? (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {farm.description}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {[farm.area, farm.city, farm.postalCode].filter(Boolean).join(', ') ||
                      t('address')}
                  </Typography>
                  {farm.products?.length ? (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {farm.products
                        .map((p) => `${p.name || p.milkType} · ${formatCurrency(p.currentRatePerLitre)}/L`)
                        .join(' · ')}
                    </Typography>
                  ) : null}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
          {!results.length ? (
            <Box>
              <Alert severity="info" sx={{ mb: diagnostics.length ? 2 : 0 }}>
                {t('noData')} · {t('pleaseTryAgain')}
              </Alert>
              {diagnostics.length ? (
                <Stack spacing={1}>
                  {diagnostics.map((reason) => (
                    <Alert key={reason.code} severity="warning">
                      {reason.message}
                    </Alert>
                  ))}
                </Stack>
              ) : null}
            </Box>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  )
}
