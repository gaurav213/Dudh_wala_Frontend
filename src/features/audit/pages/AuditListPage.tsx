import { Box, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { ErrorState } from '../../../components/feedback/ErrorState'
import { DataTable, PageHeader } from '../../../components/tables/DataTable'
import { useQueryFilters } from '../../../hooks/useQueryFilters'
import { formatDate } from '../../../utils/format'
import { auditApi } from '../api/auditApi'
import type { AuditLog } from '../types/audit'

const columnHelper = createColumnHelper<AuditLog>()
const defaultFilters = {
  action: '',
  entityType: '',
  actorId: '',
  from: '',
  to: '',
  page: '1',
  limit: '20',
}

export function AuditListPage() {
  const [filters, setFilters] = useQueryFilters(defaultFilters)

  const query = useQuery({
    queryKey: ['audit', filters],
    queryFn: () =>
      auditApi.list({
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        actorId: filters.actorId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: Number(filters.page) || 1,
        limit: Number(filters.limit) || 20,
      }),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('createdAt', {
        header: 'When',
        cell: (i) => formatDate(i.getValue()),
      }),
      columnHelper.accessor('actorName', {
        header: 'Actor',
        cell: (i) => `${i.getValue()} (${i.row.original.actorRole})`,
      }),
      columnHelper.accessor('action', { header: 'Action' }),
      columnHelper.accessor('entityType', {
        header: 'Entity',
        cell: (i) => `${i.getValue()} · ${i.row.original.entityId}`,
      }),
      columnHelper.accessor('ipAddress', {
        header: 'IP',
        cell: (i) => i.getValue() || '—',
      }),
    ],
    [],
  )

  if (query.isError) {
    return (
      <ErrorState
        title="Failed to load audit logs"
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  return (
    <Box>
      <PageHeader title="Audit log" subtitle="Read-only trail of administrative actions" />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Action"
          size="small"
          value={filters.action}
          onChange={(e) => setFilters({ action: e.target.value, page: '1' })}
        />
        <TextField
          label="Entity type"
          size="small"
          value={filters.entityType}
          onChange={(e) => setFilters({ entityType: e.target.value, page: '1' })}
        />
        <TextField
          label="From"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.from}
          onChange={(e) => setFilters({ from: e.target.value, page: '1' })}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.to}
          onChange={(e) => setFilters({ to: e.target.value, page: '1' })}
        />
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
