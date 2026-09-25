import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid2 as Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { LoadingState } from '../../../components/feedback/LoadingState'
import { PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { formatLiters } from '../../../utils/format'
import { farmApi } from '../api/farmApi'
import { useMyFarm } from '../hooks/useMyFarm'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

export function FarmStaffDetailPage() {
  const { t } = useTranslation()
  const { staffUserId = '' } = useParams()
  const navigate = useNavigate()
  const { farmId, isLoading: farmLoading } = useMyFarm()
  const [section, setSection] = useState<'all' | 'pending' | 'extra' | 'edited'>('all')

  const detailQuery = useQuery({
    queryKey: ['farm', farmId, 'staff', staffUserId],
    queryFn: () => farmApi.staffDetail(farmId!, staffUserId),
    enabled: Boolean(farmId && staffUserId),
  })

  const todayQuery = useQuery({
    queryKey: ['farm', farmId, 'staff', staffUserId, 'today', section],
    queryFn: () => farmApi.staffToday(farmId!, staffUserId, section),
    enabled: Boolean(farmId && staffUserId),
  })

  if (farmLoading || detailQuery.isLoading) {
    return <LoadingState label={t('loading')} />
  }
  if (detailQuery.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(detailQuery.error as Error).message}
        onRetry={() => void detailQuery.refetch()}
      />
    )
  }

  const detail = detailQuery.data!
  const deliveries = todayQuery.data?.deliveries ?? []

  return (
    <Box>
      <PageHeader
        title={detail.profile.name}
        subtitle={`${detail.profile.mobileNumber}${detail.profile.email ? ` · ${detail.profile.email}` : ''}`}
        actions={
          <Stack direction="row" spacing={1}>
            <StatusChip status={detail.profile.status} />
            <Button component={RouterLink} to="/farm/staff" variant="outlined">
              {t('back')} · {t('staff')}
            </Button>
          </Stack>
        }
      />

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        {t('datesToday')}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('customers')} value={detail.today.assignedCustomers} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('delivered')} value={detail.today.deliveredCount} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('pending')} value={detail.today.pendingCount} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('skipped')} value={detail.today.skippedCount} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('milk')} value={formatLiters(detail.today.scheduledQuantity)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('extraMilk')} value={formatLiters(detail.today.totalExtraQuantity)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={t('total')} value={formatLiters(detail.today.totalDeliveredQuantity)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stat label={`${t('edit')} · ${t('datesToday')}`} value={detail.editStats.editedToday} />
        </Grid>
      </Grid>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('deliveries')}: {detail.lifetimeDeliveryCount} · {t('thisWeek')}:{' '}
        {detail.editStats.editedThisWeek} · {t('thisMonth')}: {detail.editStats.editedThisMonth} · {t('collected')}:
        ₹{detail.today.cashCollected}
      </Typography>

      <Tabs
        value={section}
        onChange={(_, v) => setSection(v)}
        sx={{ mb: 2 }}
        variant="scrollable"
      >
        <Tab value="all" label={`${t('all')} · ${t('datesToday')}`} />
        <Tab value="pending" label={`${t('pending')} (${detail.today.pendingCount})`} />
        <Tab value="extra" label={t('extra')} />
        <Tab value="edited" label={`${t('edit')} (${detail.editStats.editedToday})`} />
      </Tabs>

      {todayQuery.isLoading ? (
        <LoadingState label={t('loading')} />
      ) : deliveries.length === 0 ? (
        <EmptyState title={t('noData')} />
      ) : (
        <Stack spacing={1.5}>
          {deliveries.map((d) => (
            <Card key={d.id} variant="outlined">
              <CardActionArea
                onClick={() => navigate(`/farm/today/${d.customerId}`)}
              >
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>
                          {d.customerName ?? t('customer')}
                        </Typography>
                        <Chip size="small" label={d.status} />
                        {d.isEdited ? (
                          <Chip
                            size="small"
                            color="warning"
                            label={
                              d.editReviewStatus === 'PENDING_REVIEW'
                                ? `${t('edit')} · ${t('reviews')}`
                                : t('edit')
                            }
                          />
                        ) : null}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {t('milk')} {formatLiters(d.scheduledQuantity)}
                        {Number(d.extraQuantity) > 0
                          ? ` · ${t('extra')} ${formatLiters(d.extraQuantity)}`
                          : ''}
                        {d.finalDeliveredQuantity
                          ? ` · ${t('delivered')} ${formatLiters(d.finalDeliveredQuantity)}`
                          : ''}
                      </Typography>
                      {d.address ? (
                        <Typography variant="caption" color="text.secondary">
                          {d.address}
                        </Typography>
                      ) : null}
                    </Box>
                    <Typography variant="body2" color="primary">
                      {t('openArrow')} {t('customer')}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  )
}
