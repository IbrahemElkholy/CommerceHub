import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { setAccessToken } from '@/api/client';
import { ROUTES } from '@/constants/routes';
import type { LoginRequest } from '../types';

export function useLoginMutation() {
  const { setAuth } = useAuthStore();
  const showSnackbar = useUiStore((s) => s.showSnackbar);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.HOME;

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const authResponse = await authService.login(data);
      setAccessToken(authResponse.accessToken);
      const user = await userService.getMe(authResponse.accessToken);
      return { authResponse, user };
    },
    onSuccess: ({ authResponse, user }) => {
      setAuth(user, authResponse.accessToken, authResponse.refreshToken);
      showSnackbar(`Welcome back, ${user.firstName}!`, 'success');
      const destination = user.roles.includes('ADMIN') ? ROUTES.ADMIN_DASHBOARD : from;
      navigate(destination, { replace: true });
    },
  });
}
