import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { useAuthStore } from '@/store/authStore';
import { useApiError } from '@/hooks/useApiError';
import { useUiStore } from '@/store/uiStore';
import { setAccessToken } from '@/api/client';
import { ROUTES } from '@/constants/routes';
import type { RegisterRequest } from '../types';

export function useRegisterMutation() {
  const { setAuth } = useAuthStore();
  const { handleError } = useApiError();
  const showSnackbar = useUiStore((s) => s.showSnackbar);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const authResponse = await authService.register(data);
      setAccessToken(authResponse.accessToken);
      const user = await userService.getMe(authResponse.accessToken);
      return { authResponse, user };
    },
    onSuccess: ({ authResponse, user }) => {
      setAuth(user, authResponse.accessToken, authResponse.refreshToken);
      showSnackbar('Account created successfully!', 'success');
      navigate(ROUTES.HOME, { replace: true });
    },
    onError: handleError,
  });
}
