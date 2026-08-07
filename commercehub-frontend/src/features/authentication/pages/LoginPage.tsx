import { Box, Typography, TextField, Button, Link, CircularProgress, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { PasswordField } from '@/components/common/PasswordField';
import { ROUTES } from '@/constants/routes';
import { loginSchema, type LoginFormValues } from '@/validators/authValidators';
import { useLoginMutation } from '../hooks/useLoginMutation';
import type { ApiErrorResponse } from '@/types/api';

function getLoginErrorMessage(error: unknown): string | null {
  if (!error) return null;
  const apiError = error as ApiErrorResponse;
  const status = apiError?.error?.status;
  if (apiError?.error?.message) return apiError.error.message;
  if (status === 401 || status === 403) {
    return 'Invalid email or password. Please try again.';
  }
  return 'Unable to sign in. Please check your credentials and try again.';
}

export function LoginPage() {
  const { mutate: login, isPending, error } = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginErrorMessage = getLoginErrorMessage(error);

  return (
    <>
      <Helmet>
        <title>Login — CommerceHub</title>
      </Helmet>

      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          Sign in to CommerceHub
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Enter your email and password to continue
        </Typography>
      </Box>

      {loginErrorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loginErrorMessage}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit((data) => login(data))} noValidate>
        <TextField
          label="Email"
          type="email"
          fullWidth
          autoComplete="email"
          margin="normal"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <PasswordField
          label="Password"
          fullWidth
          autoComplete="current-password"
          margin="normal"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Link component={RouterLink} to={ROUTES.FORGOT_PASSWORD} variant="body2">
            Forgot password?
          </Link>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isPending}
          sx={{ mt: 1, mb: 2 }}
        >
          {isPending ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
        </Button>

        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Don&apos;t have an account?{' '}
          <Link component={RouterLink} to={ROUTES.REGISTER} sx={{ fontWeight: 600 }}>
            Create one
          </Link>
        </Typography>
      </Box>
    </>
  );
}
