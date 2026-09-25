import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { PageHeader } from '../../../components/tables/DataTable'
import { formatLiters } from '../../../utils/format'
import { deliveryStaffApi } from '../api/deliveryStaffApi'

export function DeliveryCustomersPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const query = useQuery({
    queryKey: ['delivery-staff', 'customers'],
    queryFn: () => deliveryStaffApi.customers(),
  })

  const rows = useMemo(() => {
    const all = query.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((c) => {
      const name = (c.name ?? '').toLowerCase()
      const mobile = (c.mobileNumber ?? '').toLowerCase()
      const address = (c.addressSummary ?? '').toLowerCase()
      return name.includes(q) || mobile.includes(q) || address.includes(q)
    })
  }, [query.data, search])

  if (query.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (query.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void query.refetch()}>
            {t('retry')}
          </Button>
        }
      >
        {t('couldNotLoad')}. {(query.error as Error).message}
      </Alert>
    )
  }

  const all = query.data ?? []
  if (!all.length) {
    return (
      <Box>
        <PageHeader
          title={t('customers')}
          subtitle={t('route')}
        />
        <EmptyState
          title={t('noData')}
          description={t('connectedCustomers')}
        />
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader
        title={t('customers')}
        subtitle={t('search')}
      />

      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('search')}
        fullWidth
        size="small"
        sx={{ mb: 2, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: search ? (
            <InputAdornment position="end">
              <IconButton size="small" aria-label={t('clear')} onClick={() => setSearch('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={t('noData')}
          description={t('search')}
          action={
            <Button variant="outlined" onClick={() => setSearch('')}>
              {t('clear')}
            </Button>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {rows.map((c) => (
            <Card key={c.customerId} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Box>
                    <Typography fontWeight={700}>{c.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {c.addressSummary || t('address')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {c.milkType ?? t('milk')} · {formatLiters(c.regularQuantity)}
                    </Typography>
                    <Typography variant="body2">
                      {t('datesToday')}: {formatLiters(c.todayTotalQuantity ?? '0')}
                    </Typography>
                    {c.mobileNumber ? (
                      <Typography variant="body2" color="text.secondary">
                        {c.mobileNumber}
                      </Typography>
                    ) : null}
                  </Box>
                  <Chip label={c.todayStatus ?? 'NONE'} size="small" />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  )
}
