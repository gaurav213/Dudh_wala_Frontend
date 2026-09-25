import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Grid2 as Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatLiters } from '../../../utils/format'
import { deliveryStaffApi, type DeliveryStaffDashboard } from '../api/deliveryStaffApi'

function StatCard({
  label,
  value,
  to,
}: {
  label: string
  value: string | number
  to?: string
}) {
  const body = (
    <CardContent>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={800}>
        {value}
      </Typography>
    </CardContent>
  )
  if (!to) return <Card variant="outlined">{body}</Card>
  return (
    <Card variant="outlined">
      <CardActionArea component={RouterLink} to={to}>
        {body}
      </CardActionArea>
    </Card>
  )
}

export function DeliveryDashboardPage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['delivery-staff', 'dashboard'],
    queryFn: () => deliveryStaffApi.dashboard(),
  })

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

  const d = query.data as DeliveryStaffDashboard

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" fontWeight={800}>
          {t('farmAajKiList')}
        </Typography>
        <Typography color="text.secondary">{d.date}</Typography>
      </Box>

      <Button
        component={RouterLink}
        to="/delivery/today"
        variant="contained"
        size="large"
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('deliveries')}
      </Button>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={t('customers')} value={d.todaysCustomers} to="/delivery/customers" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={t('pending')} value={d.pending} to="/delivery/today" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={t('delivered')} value={d.delivered} to="/delivery/today" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={t('navExtraRequests')} value={d.extraRequests} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={t('milk')} value={formatLiters(d.plannedLitres)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={`${t('delivered')} ${t('milk')}`} value={formatLiters(d.deliveredLitres)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label={t('farmToCollect')}
            value={`₹${d.cashToCollect}`}
            to="/delivery/pending-cash"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard label={`${t('collected')} · ${t('datesToday')}`} value={`₹${d.paymentsCollectedToday}`} />
        </Grid>
      </Grid>
    </Stack>
  )
}
