import { Box, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        header: t('day'),
        cell: (i) => formatDate(i.getValue()),
      }),
      columnHelper.accessor('actorName', {
        header: t('profile'),
        cell: (i) => `${i.getValue()} (${i.row.original.actorRole})`,
      }),
      columnHelper.accessor('action', { header: t('details') }),
      columnHelper.accessor('entityType', {
        header: t('details'),
        cell: (i) => `${i.getValue()} · ${i.row.original.entityId}`,
      }),
      columnHelper.accessor('ipAddress', {
        header: t('ipAddress'),
        cell: (i) => i.getValue() || '—',
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
      <PageHeader title={t('navAudit')} subtitle={t('history')} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label={t('details')}
          size="small"
          value={filters.action}
          onChange={(e) => setFilters({ action: e.target.value, page: '1' })}
        />
        <TextField
          label={t('filter')}
          size="small"
          value={filters.entityType}
          onChange={(e) => setFilters({ entityType: e.target.value, page: '1' })}
        />
        <TextField
          label={t('from')}
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filters.from}
          onChange={(e) => setFilters({ from: e.target.value, page: '1' })}
        />
        <TextField
          label={t('to')}
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
