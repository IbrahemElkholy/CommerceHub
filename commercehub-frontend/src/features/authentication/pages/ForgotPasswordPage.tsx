import { Box, Typography, TextField, Button, Link, CircularProgress, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Helmet } from 'react-helmet-async';
import { useMutation } from '@tanstack/react-query';
import { ROUTES } from '@/constants/routes';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/validators/authValidators';
import { authService } from '../services/authService';

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (data: ForgotPasswordFormValues) =>
      authService.requestPasswordReset({ email: data.email }),
  });

  return (
    <>
      <Helmet>
        <title>Forgot Password — CommerceHub</title>
      </Helmet>

      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          Reset your password
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Enter your email and we&apos;ll send you a reset link.
        </Typography>
      </Box>

      {isSuccess ? (
        <Alert severity="success">
          If an account with that email exists, you will receive a password reset link shortly.
        </Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit((d) => mutate(d))} noValidate>
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

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isPending}
            sx={{ mt: 2, mb: 2 }}
          >
            {isPending ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Link'}
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
