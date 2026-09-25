import { Box, Button, MenuItem, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { DataTable, PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { useQueryFilters } from '../../../hooks/useQueryFilters'
import { formatDate } from '../../../utils/format'
import type { Farm } from '../../farm/types/farm'
import { adminFarmsApi } from '../api/adminFarmsApi'

const columnHelper = createColumnHelper<Farm>()

const defaultFilters = {
  search: '',
  status: '',
  page: '1',
  limit: '20',
}

export function AdminFarmsPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useQueryFilters(defaultFilters)

  const query = useQuery({
    queryKey: ['admin-farms', filters],
    queryFn: () =>
      adminFarmsApi.list({
        search: filters.search || undefined,
        status: filters.status || undefined,
        page: Number(filters.page) || 1,
        limit: Number(filters.limit) || 20,
      }),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: t('farm'),
        cell: (info) => (
          <Button component={RouterLink} to={`/admin/farms/${info.row.original.id}`} size="small">
            {info.getValue()}
          </Button>
        ),
      }),
      columnHelper.accessor('businessName', {
        header: t('name'),
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('mobileNumber', { header: t('mobileNumber') }),
      columnHelper.accessor('city', { header: t('city') }),
      columnHelper.accessor('status', {
        header: t('status'),
        cell: (info) => <StatusChip status={info.getValue()} />,
      }),
      columnHelper.accessor('createdAt', {
        header: t('status'),
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [t],
  )

  if (query.isError) {
    return (
      <ErrorState
        title={t('couldNotLoad')}
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <Box>
      <PageHeader
        title={t('navFarmApprovals')}
        subtitle={`${t('approve')} · ${t('reject')}`}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label={t('search')}
          size="small"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value, page: '1' })}
          fullWidth
          inputProps={{ 'aria-label': t('search') }}
        />
        <TextField
          select
          label={t('status')}
          size="small"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: '1' })}
          sx={{ minWidth: 200 }}
          inputProps={{ 'aria-label': t('filter') }}
        >
          <MenuItem value="">{t('all')}</MenuItem>
          <MenuItem value="PENDING_APPROVAL">{t('pending')}</MenuItem>
          <MenuItem value="ACTIVE">{t('active')}</MenuItem>
          <MenuItem value="SUSPENDED">{t('cancelled')}</MenuItem>
          <MenuItem value="REJECTED">{t('reject')}</MenuItem>
          <MenuItem value="BLOCKED">{t('blocked')}</MenuItem>
          <MenuItem value="CLOSED">{t('close')}</MenuItem>
        </TextField>
      </Stack>
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        emptyTitle={t('noData')}
        page={Number(filters.page) || 1}
        limit={Number(filters.limit) || 20}
        total={query.data?.meta.total ?? 0}
        onPageChange={(page) => setFilters({ page: String(page) })}
        onLimitChange={(limit) => setFilters({ limit: String(limit), page: '1' })}
      />
    </Box>
  )
}
