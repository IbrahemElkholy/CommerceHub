import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { PasswordField } from '@/components/common/PasswordField';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import {
  updateProfileSchema,
  addressSchema,
  changePasswordSchema,
  type UpdateProfileFormValues,
  type AddressFormValues,
} from '@/validators/authValidators';
import type { z } from 'zod';
import type { UserResponse } from '../types';

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ProfilePage() {
  const queryClient = useQueryClient();
  const showSnackbar = useUiStore((s) => s.showSnackbar);
  const { setUser } = useAuthStore();
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const { data: user } = useQuery<UserResponse>({
    queryKey: QUERY_KEYS.USERS.ME,
    queryFn: () => userService.getMe(),
  });

  const { data: addresses } = useQuery({
    queryKey: QUERY_KEYS.USERS.ADDRESSES,
    queryFn: userService.getAddresses,
  });

  const profileForm = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    values: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? null },
  });

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      streetLine1: '',
      streetLine2: '',
      city: '',
      state: '',
      postalCode: '',
      countryCode: '',
      isDefault: false,
    },
  });

  const bindAddressField = (name: keyof AddressFormValues) => {
    const { ref, ...rest } = addressForm.register(name);
    return { inputRef: ref, ...rest };
  };

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordValues) =>
      userService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      showSnackbar('Password updated successfully!', 'success');
      passwordForm.reset();
    },
    onError: () => showSnackbar('Current password is incorrect.', 'error'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileFormValues) => userService.updateMe(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(QUERY_KEYS.USERS.ME, updatedUser);
      showSnackbar('Profile updated!', 'success');
    },
    onError: () => showSnackbar('Could not update profile.', 'error'),
  });

  const addAddressMutation = useMutation({
    mutationFn: (data: AddressFormValues) => userService.addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ADDRESSES });
      showSnackbar('Address added!', 'success');
      setAddressDialogOpen(false);
      addressForm.reset();
    },
    onError: () => showSnackbar('Could not save address.', 'error'),
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressFormValues }) =>
      userService.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ADDRESSES });
      showSnackbar('Address updated!', 'success');
      setAddressDialogOpen(false);
      setEditingAddressId(null);
      addressForm.reset();
    },
    onError: () => showSnackbar('Could not update address.', 'error'),
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => userService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ADDRESSES });
      showSnackbar('Address deleted.', 'info');
    },
    onError: () => showSnackbar('Could not delete address.', 'error'),
  });

  const handleAddressSubmit = (data: AddressFormValues) => {
    if (editingAddressId) {
      updateAddressMutation.mutate({ id: editingAddressId, data });
    } else {
      addAddressMutation.mutate(data);
    }
  };

  const openEditAddress = (id: string) => {
    const addr = addresses?.find((a) => a.id === id);
    if (addr) {
      addressForm.reset({
        label: addr.label ?? '',
        streetLine1: addr.streetLine1 ?? '',
        streetLine2: addr.streetLine2 ?? '',
        city: addr.city ?? '',
        state: addr.state ?? '',
        postalCode: addr.postalCode ?? '',
        countryCode: addr.countryCode ?? '',
        isDefault: addr.isDefault ?? false,
      });
      setEditingAddressId(id);
      setAddressDialogOpen(true);
    }
  };

  return (
    <>
      <Helmet><title>My Profile — CommerceHub</title></Helmet>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>My Profile</Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Personal Information</Typography>
                <Box
                  component="form"
                  onSubmit={profileForm.handleSubmit((d) => updateProfileMutation.mutate(d))}
                  noValidate
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="First Name"
                        fullWidth
                        {...profileForm.register('firstName')}
                        error={!!profileForm.formState.errors.firstName}
                        helperText={profileForm.formState.errors.firstName?.message}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Last Name"
                        fullWidth
                        {...profileForm.register('lastName')}
                        error={!!profileForm.formState.errors.lastName}
                        helperText={profileForm.formState.errors.lastName?.message}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Email"
                        fullWidth
                        value={user?.email ?? ''}
                        disabled
                        helperText="Email cannot be changed."
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Phone"
                        fullWidth
                        {...profileForm.register('phone')}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Grid>
                  </Grid>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ mt: 2 }}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Change Password</Typography>
                <Box
                  component="form"
                  onSubmit={passwordForm.handleSubmit((d) => changePasswordMutation.mutate(d))}
                  noValidate
                >
                  <PasswordField
                    label="Current Password"
                    fullWidth
                    margin="normal"
                    {...passwordForm.register('currentPassword')}
                    error={!!passwordForm.formState.errors.currentPassword}
                    helperText={passwordForm.formState.errors.currentPassword?.message}
                  />
                  <PasswordField
                    label="New Password"
                    fullWidth
                    margin="normal"
                    {...passwordForm.register('newPassword')}
                    error={!!passwordForm.formState.errors.newPassword}
                    helperText={passwordForm.formState.errors.newPassword?.message}
                  />
                  <PasswordField
                    label="Confirm New Password"
                    fullWidth
                    margin="normal"
                    {...passwordForm.register('confirmPassword')}
                    error={!!passwordForm.formState.errors.confirmPassword}
                    helperText={passwordForm.formState.errors.confirmPassword?.message}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ mt: 2 }}
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Saved Addresses</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      addressForm.reset({
                        label: '',
                        streetLine1: '',
                        streetLine2: '',
                        city: '',
                        state: '',
                        postalCode: '',
                        countryCode: '',
                        isDefault: false,
                      });
                      setEditingAddressId(null);
                      setAddressDialogOpen(true);
                    }}
                  >
                    Add Address
                  </Button>
                </Box>
                {addresses?.length === 0 ? (
                  <Alert severity="info">No addresses saved yet.</Alert>
                ) : (
                  addresses?.map((addr) => (
                    <Box key={addr.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="body2">
                            {addr.label ? <><strong>{addr.label}</strong> — </> : null}
                            {[
                              addr.streetLine1,
                              addr.streetLine2,
                              addr.city,
                              [addr.state, addr.postalCode].filter((x): x is string => !!x).join(' '),
                              addr.countryCode,
                            ]
                              .filter((x): x is string => !!x)
                              .join(', ')}
                          </Typography>
                          {addr.isDefault && <Chip label="Default" size="small" color="primary" sx={{ mt: 0.5 }} />}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" onClick={() => openEditAddress(addr.id)}>Edit</Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => deleteAddressMutation.mutate(addr.id)}
                            disabled={deleteAddressMutation.isPending}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                      <Divider sx={{ mt: 1.5 }} />
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAddressId ? 'Edit Address' : 'Add Address'}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="address-form"
            onSubmit={addressForm.handleSubmit(handleAddressSubmit)}
            noValidate
          >
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12 }}>
                <TextField label="Label (optional, e.g. Home)" fullWidth {...bindAddressField('label')} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Street Address" fullWidth {...bindAddressField('streetLine1')} error={!!addressForm.formState.errors.streetLine1} helperText={addressForm.formState.errors.streetLine1?.message} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Apartment, suite, etc. (optional)" fullWidth {...bindAddressField('streetLine2')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="City" fullWidth {...bindAddressField('city')} error={!!addressForm.formState.errors.city} helperText={addressForm.formState.errors.city?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="State / Province" fullWidth {...bindAddressField('state')} error={!!addressForm.formState.errors.state} helperText={addressForm.formState.errors.state?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Postal Code" fullWidth {...bindAddressField('postalCode')} error={!!addressForm.formState.errors.postalCode} helperText={addressForm.formState.errors.postalCode?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Country Code (e.g. EG, US)" fullWidth {...bindAddressField('countryCode')} error={!!addressForm.formState.errors.countryCode} helperText={addressForm.formState.errors.countryCode?.message} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddressDialogOpen(false)}>Cancel</Button>
          <Button
            type="submit"
            form="address-form"
            variant="contained"
            disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
          >
            {addAddressMutation.isPending || updateAddressMutation.isPending
              ? <CircularProgress size={20} color="inherit" />
              : editingAddressId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
