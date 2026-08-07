import { useState } from 'react';
import {
  Container, Typography, Box, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormGroup, FormControlLabel, Checkbox, CircularProgress,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SearchBox } from '@/components/common/SearchBox';
import { userService } from '@/features/authentication/services/userService';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useUiStore } from '@/store/uiStore';
import { useDebounce } from '@/hooks/useDebounce';
import type { UserResponse, UserRole, UserSummaryResponse } from '@/features/authentication/types';

const ASSIGNABLE_ROLES: UserRole[] = ['ADMIN', 'WAREHOUSE', 'SUPPORT', 'SYSTEM_ADMIN'];

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const showSnackbar = useUiStore((s) => s.showSnackbar);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.USERS.ADMIN_LIST({ page }),
    queryFn: () => userService.listUsers({ page, size: 20 }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      userService.updateUserStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ADMIN_LIST({}) });
      showSnackbar('User status updated.', 'success');
    },
    onError: () => showSnackbar('Could not update user status.', 'error'),
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userService.assignRole(id, role),
    onSuccess: (updatedUser) => {
      setSelectedUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ADMIN_LIST({}) });
      showSnackbar('Role assigned.', 'success');
    },
    onError: () => showSnackbar('Could not assign role.', 'error'),
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => userService.removeRole(id, role),
    onSuccess: (updatedUser) => {
      setSelectedUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ADMIN_LIST({}) });
      showSnackbar('Role removed.', 'success');
    },
    onError: () => showSnackbar('Could not remove role.', 'error'),
  });

  const openRoleDialog = async (row: UserSummaryResponse) => {
    const user = await userService.getUserById(row.id);
    setSelectedUser(user);
  };

  const handleRoleToggle = (role: UserRole, hasRole: boolean) => {
    if (!selectedUser) return;
    if (hasRole) {
      removeRoleMutation.mutate({ id: selectedUser.id, role });
    } else {
      assignRoleMutation.mutate({ id: selectedUser.id, role });
    }
  };

  const columns: Column<UserSummaryResponse>[] = [
    {
      key: 'fullName',
      label: 'Name',
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.fullName}</Typography>,
    },
    { key: 'email', label: 'Email', render: (row) => row.email },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.status}
          color={row.status === 'ACTIVE' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => openRoleDialog(row)}
          >
            Roles
          </Button>
          <Button
            size="small"
            variant="outlined"
            color={row.status === 'ACTIVE' ? 'error' : 'success'}
            onClick={() =>
              toggleStatusMutation.mutate({
                id: row.id,
                status: row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
              })
            }
            disabled={toggleStatusMutation.isPending}
          >
            {row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </Button>
        </Box>
      ),
    },
  ];

  const isRolePending = assignRoleMutation.isPending || removeRoleMutation.isPending;

  return (
    <>
      <Helmet><title>Users — Admin</title></Helmet>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Users</Typography>

        <Box sx={{ mb: 2 }}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search users..." />
        </Box>

        <DataTable
          columns={columns}
          rows={data?.data.content ?? []}
          keyExtractor={(row) => row.id}
          loading={isLoading}
          totalElements={data?.data.totalElements}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          emptyMessage="No users found."
        />
      </Container>

      <Dialog open={!!selectedUser} onClose={() => setSelectedUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Manage Roles — {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {selectedUser?.email}
          </Typography>
          <FormGroup>
            {ASSIGNABLE_ROLES.map((role) => {
              const hasRole = selectedUser?.roles.includes(role) ?? false;
              return (
                <FormControlLabel
                  key={role}
                  control={
                    <Checkbox
                      checked={hasRole}
                      onChange={() => handleRoleToggle(role, hasRole)}
                      disabled={isRolePending}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {role}
                      {isRolePending && <CircularProgress size={14} />}
                    </Box>
                  }
                />
              );
            })}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
