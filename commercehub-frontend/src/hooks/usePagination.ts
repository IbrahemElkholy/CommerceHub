import { useState } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialSize?: number;
}

export function usePagination({ initialPage = 0, initialSize = 20 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [size] = useState(initialSize);

  const goToPage = (newPage: number) => setPage(newPage);
  const reset = () => setPage(0);

  return { page, size, goToPage, reset };
}
