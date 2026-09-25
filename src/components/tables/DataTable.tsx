import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '../feedback/EmptyState'
import { LoadingState } from '../feedback/LoadingState'

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[]
  data: T[]
  isLoading?: boolean
  emptyTitle?: string
  page?: number
  limit?: number
  total?: number
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyTitle,
  page = 1,
  limit = 20,
  total = 0,
  onPageChange,
  onLimitChange,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(total / limit) || 1),
  })

  if (isLoading) return <LoadingState />
  if (!data.length) return <EmptyState title={emptyTitle ?? t('noData')} />

  return (
    <Box>
      <TableContainer>
        <Table size="small" aria-label={t('dataTable')}>
          <TableHead>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableCell key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} hover>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {onPageChange ? (
        <TablePagination
          component="div"
          count={total}
          page={Math.max(0, page - 1)}
          onPageChange={(_, next) => onPageChange(next + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => onLimitChange?.(Number(e.target.value))}
          rowsPerPageOptions={[10, 20, 50]}
        />
      ) : null}
    </Box>
  )
}

export function StatusChip({ status }: { status: string }) {
  const color =
    status === 'ACTIVE'
      ? 'success'
      : status === 'BLOCKED' || status === 'FAILED'
        ? 'error'
        : status === 'PENDING' || status === 'OUTSTANDING'
          ? 'warning'
          : 'default'

  return <Chip size="small" label={status} color={color} variant="outlined" />
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions}
    </Stack>
  )
}
