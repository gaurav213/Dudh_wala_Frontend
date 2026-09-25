import {
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { DataTable, PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { useQueryFilters } from '../../../hooks/useQueryFilters'
import { formatDate } from '../../../utils/format'
import { suppliersApi } from '../api/suppliersApi'
import type { Supplier } from '../types/supplier'

const columnHelper = createColumnHelper<Supplier>()

const defaultFilters = {
  search: '',
  status: '',
  page: '1',
  limit: '20',
}

export function SuppliersListPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useQueryFilters(defaultFilters)

  const query = useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () =>
      suppliersApi.list({
        search: filters.search || undefined,
        status: filters.status || undefined,
        page: Number(filters.page) || 1,
        limit: Number(filters.limit) || 20,
      }),
  })

  const activateMutation = useMutation({
    mutationFn: suppliersApi.activate,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  })
  const blockMutation = useMutation({
    mutationFn: suppliersApi.block,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('fullName', {
        header: t('name'),
        cell: (info) => (
          <Button component={RouterLink} to={`/suppliers/${info.row.original.id}`} size="small">
            {info.getValue()}
          </Button>
        ),
      }),
      columnHelper.accessor('email', { header: t('emailOptional') }),
      columnHelper.accessor('phone', {
        header: t('mobileNumber'),
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('status', {
        header: t('status'),
        cell: (info) => <StatusChip status={info.getValue()} />,
      }),
      columnHelper.accessor('customerCount', { header: t('customers') }),
      columnHelper.accessor('createdAt', {
        header: t('status'),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.display({
        id: 'actions',
        header: t('more'),
        cell: ({ row }) => (
          <Stack direction="row" spacing={1}>
            {row.original.status !== 'ACTIVE' ? (
              <Button
                size="small"
                onClick={() => activateMutation.mutate(row.original.id)}
                disabled={activateMutation.isPending}
              >
                {t('active')}
              </Button>
            ) : (
              <Button
                size="small"
                color="error"
                onClick={() => blockMutation.mutate(row.original.id)}
                disabled={blockMutation.isPending}
              >
                {t('blocked')}
              </Button>
            )}
          </Stack>
        ),
      }),
    ],
    [activateMutation, blockMutation, t],
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
      <PageHeader title={t('navLegacySuppliers')} subtitle={`${t('search')} · ${t('filter')}`} />
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
          sx={{ minWidth: 160 }}
          inputProps={{ 'aria-label': t('filter') }}
        >
          <MenuItem value="">{t('all')}</MenuItem>
          <MenuItem value="ACTIVE">{t('active')}</MenuItem>
          <MenuItem value="INACTIVE">{t('cancelled')}</MenuItem>
          <MenuItem value="BLOCKED">{t('blocked')}</MenuItem>
          <MenuItem value="PENDING">{t('pending')}</MenuItem>
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
