import { Box, Typography, TextField, Button, Link, CircularProgress, Grid, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { PasswordField } from '@/components/common/PasswordField';
import { ROUTES } from '@/constants/routes';
import { registerSchema, type RegisterFormValues } from '@/validators/authValidators';
import { useRegisterMutation } from '../hooks/useRegisterMutation';
import type { ApiErrorResponse } from '@/types/api';

export function RegisterPage() {
  const { mutate: register, isPending, error } = useRegisterMutation();

  const {
    register: rhfRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const apiError = error as ApiErrorResponse | null;

  const onSubmit = (data: RegisterFormValues) => {
    const { confirmPassword: _cp, ...payload } = data;
    register(payload);
  };

  return (
    <>
      <Helmet>
        <title>Create Account — CommerceHub</title>
      </Helmet>

      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          Create your account
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Join CommerceHub today
        </Typography>
      </Box>

      {apiError?.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiError.error.message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="First Name"
              fullWidth
              autoComplete="given-name"
              {...rhfRegister('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Last Name"
              fullWidth
              autoComplete="family-name"
              {...rhfRegister('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              autoComplete="email"
              {...rhfRegister('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <PasswordField
              label="Password"
              fullWidth
              autoComplete="new-password"
              {...rhfRegister('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <PasswordField
              label="Confirm Password"
              fullWidth
              autoComplete="new-password"
              {...rhfRegister('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isPending}
          sx={{ mt: 3, mb: 2 }}
        >
          {isPending ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
        </Button>

        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Already have an account?{' '}
          <Link component={RouterLink} to={ROUTES.LOGIN} sx={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </>
  );
}
