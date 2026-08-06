import { Box, Button, MenuItem, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { DataTable, PageHeader, StatusChip } from '../../../components/tables/DataTable'
import { useQueryFilters } from '../../../hooks/useQueryFilters'
import { formatDate } from '../../../utils/format'
import { customersApi } from '../api/customersApi'
import type { Customer } from '../types/customer'

const columnHelper = createColumnHelper<Customer>()
const defaultFilters = { search: '', status: '', supplierId: '', page: '1', limit: '20' }

export function CustomersListPage() {
  const [filters, setFilters] = useQueryFilters(defaultFilters)

  const query = useQuery({
    queryKey: ['customers', filters],
    queryFn: () =>
      customersApi.list({
        search: filters.search || undefined,
        status: filters.status || undefined,
        supplierId: filters.supplierId || undefined,
        page: Number(filters.page) || 1,
        limit: Number(filters.limit) || 20,
      }),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('fullName', {
        header: 'Name',
        cell: (info) => (
          <Button component={RouterLink} to={`/customers/${info.row.original.id}`} size="small">
            {info.getValue()}
          </Button>
        ),
      }),
      columnHelper.accessor('supplierName', { header: 'Supplier' }),
      columnHelper.accessor('phone', { header: 'Phone', cell: (i) => i.getValue() || '—' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusChip status={info.getValue()} />,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Joined',
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [],
  )

  if (query.isError) {
    return (
      <ErrorState
        title="Failed to load customers"
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <Box>
      <PageHeader title="Customers" subtitle="Filter by supplier and account status" />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search"
          size="small"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value, page: '1' })}
          fullWidth
        />
        <TextField
          label="Supplier ID"
          size="small"
          value={filters.supplierId}
          onChange={(e) => setFilters({ supplierId: e.target.value, page: '1' })}
          sx={{ minWidth: 180 }}
        />
        <TextField
          select
          label="Status"
          size="small"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: '1' })}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
          <MenuItem value="BLOCKED">Blocked</MenuItem>
        </TextField>
      </Stack>
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        page={Number(filters.page) || 1}
        limit={Number(filters.limit) || 20}
        total={query.data?.meta.total ?? 0}
        onPageChange={(page) => setFilters({ page: String(page) })}
        onLimitChange={(limit) => setFilters({ limit: String(limit), page: '1' })}
      />
    </Box>
  )
}
