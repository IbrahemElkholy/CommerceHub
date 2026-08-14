import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Skeleton,
  Box,
} from '@mui/material';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  totalElements?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  loading = false,
  totalElements,
  page = 0,
  pageSize = 20,
  onPageChange,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  return (
    <Box>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  width={col.width}
                  align={col.align ?? 'left'}
                  sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow key={keyExtractor(row)} hover>
                    {columns.map((col) => (
                      <TableCell key={col.key} align={col.align ?? 'left'}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        {!loading && rows.length === 0 && <EmptyState title={emptyMessage} />}
      </TableContainer>

      {totalElements !== undefined && onPageChange && (
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[pageSize]}
          onPageChange={(_, newPage) => onPageChange(newPage)}
        />
      )}
    </Box>
  );
}
