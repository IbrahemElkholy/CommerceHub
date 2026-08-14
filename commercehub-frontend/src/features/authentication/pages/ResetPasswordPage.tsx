import { Box, Typography, Button, Link, CircularProgress, Alert } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { useMutation } from '@tanstack/react-query';
import { ROUTES } from '@/constants/routes';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/validators/authValidators';
import { PasswordField } from '@/components/common/PasswordField';
import { authService } from '../services/authService';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const { mutate, isPending, isSuccess, isError } = useMutation({
    mutationFn: (data: ResetPasswordFormValues) =>
      authService.resetPassword({ token: data.token, newPassword: data.newPassword }),
  });

  return (
    <>
      <Helmet>
        <title>Reset Password — CommerceHub</title>
      </Helmet>

      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          Set new password
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Enter your new password below.
        </Typography>
      </Box>

      {!token && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Invalid or missing reset token. Please request a new reset link.
        </Alert>
      )}

      {isSuccess ? (
        <Alert severity="success">
          Your password has been reset.{' '}
          <Link component={RouterLink} to={ROUTES.LOGIN}>
            Sign in now
          </Link>
        </Alert>
      ) : isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          This reset link is invalid or has expired. Please{' '}
          <Link component={RouterLink} to={ROUTES.FORGOT_PASSWORD}>
            request a new one
          </Link>
          .
        </Alert>
      ) : null}

      {!isSuccess && token && (
        <Box component="form" onSubmit={handleSubmit((d) => mutate(d))} noValidate>
          <input type="hidden" {...register('token')} />

          <PasswordField
            label="New Password"
            fullWidth
            autoComplete="new-password"
            margin="normal"
            {...register('newPassword')}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
          />

          <PasswordField
            label="Confirm New Password"
            fullWidth
            autoComplete="new-password"
            margin="normal"
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isPending}
            sx={{ mt: 2, mb: 2 }}
          >
            {isPending ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
          </Button>
        </Box>
      )}

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Link component={RouterLink} to={ROUTES.LOGIN} variant="body2">
          Back to Login
        </Link>
      </Box>
    </>
  );
}
