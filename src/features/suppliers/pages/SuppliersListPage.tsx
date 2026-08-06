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
        header: 'Name',
        cell: (info) => (
          <Button component={RouterLink} to={`/suppliers/${info.row.original.id}`} size="small">
            {info.getValue()}
          </Button>
        ),
      }),
      columnHelper.accessor('email', { header: 'Email' }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusChip status={info.getValue()} />,
      }),
      columnHelper.accessor('customerCount', { header: 'Customers' }),
      columnHelper.accessor('createdAt', {
        header: 'Registered',
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Stack direction="row" spacing={1}>
            {row.original.status !== 'ACTIVE' ? (
              <Button
                size="small"
                onClick={() => activateMutation.mutate(row.original.id)}
                disabled={activateMutation.isPending}
              >
                Activate
              </Button>
            ) : (
              <Button
                size="small"
                color="error"
                onClick={() => blockMutation.mutate(row.original.id)}
                disabled={blockMutation.isPending}
              >
                Block
              </Button>
            )}
          </Stack>
        ),
      }),
    ],
    [activateMutation, blockMutation],
  )

  if (query.isError) {
    return (
      <ErrorState
        title="Failed to load suppliers"
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <Box>
      <PageHeader title="Suppliers" subtitle="Search, filter, activate or block supplier accounts" />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search"
          size="small"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value, page: '1' })}
          fullWidth
          inputProps={{ 'aria-label': 'Search suppliers' }}
        />
        <TextField
          select
          label="Status"
          size="small"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: '1' })}
          sx={{ minWidth: 160 }}
          inputProps={{ 'aria-label': 'Filter by status' }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
          <MenuItem value="BLOCKED">Blocked</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
        </TextField>
      </Stack>
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        emptyTitle="No suppliers match these filters"
        page={Number(filters.page) || 1}
        limit={Number(filters.limit) || 20}
        total={query.data?.meta.total ?? 0}
        onPageChange={(page) => setFilters({ page: String(page) })}
        onLimitChange={(limit) => setFilters({ limit: String(limit), page: '1' })}
      />
    </Box>
  )
}
