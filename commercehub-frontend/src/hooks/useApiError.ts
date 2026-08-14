import { useUiStore } from '@/store/uiStore';
import type { ApiErrorResponse, FieldError } from '@/types/api';

interface UseApiErrorReturn {
  handleError: (error: unknown) => void;
  extractFieldErrors: (error: unknown) => Record<string, string>;
}

export function useApiError(): UseApiErrorReturn {
  const showSnackbar = useUiStore((state) => state.showSnackbar);

  const handleError = (error: unknown): void => {
    const apiError = error as ApiErrorResponse;
    if (apiError?.error?.message) {
      showSnackbar(apiError.error.message, 'error');
    } else {
      showSnackbar('An unexpected error occurred. Please try again.', 'error');
    }
  };

  const extractFieldErrors = (error: unknown): Record<string, string> => {
    const apiError = error as ApiErrorResponse;
    if (!apiError?.error?.fieldErrors?.length) return {};

    return apiError.error.fieldErrors.reduce(
      (acc: Record<string, string>, fieldError: FieldError) => {
        acc[fieldError.field] = fieldError.message;
        return acc;
      },
      {},
    );
  };

  return { handleError, extractFieldErrors };
}
