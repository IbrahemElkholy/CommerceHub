import { useState } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductCard } from '../components/ProductCard';
import { ProductFilters } from '../components/ProductFilters';
import { useProducts } from '../hooks/useProducts';
import { SearchBox } from '@/components/common/SearchBox';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDebounce } from '@/hooks/useDebounce';
import { cartService } from '@/features/cart/services/cartService';
import { wishlistService } from '@/features/wishlist/services/wishlistService';
import type { WishlistItemResponse } from '@/features/wishlist/types';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useUiStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import type { ProductFilterParams } from '../types';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'createdAt,desc' },
  { label: 'Price: Low to High', value: 'price,asc' },
  { label: 'Price: High to Low', value: 'price,desc' },
  { label: 'Name: A-Z', value: 'name,asc' },
];

const DEFAULT_FILTERS: ProductFilterParams = { page: 0, size: 20, sort: 'createdAt,desc', status: 'ACTIVE' };

export function ProductsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ProductFilterParams>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput);
  const showSnackbar = useUiStore((s) => s.showSnackbar);
  const { isAuthenticated, isAdmin, isInitialized } = useAuth();
  const queryClient = useQueryClient();

  const activeFilters: ProductFilterParams = {
    ...filters,
    search: debouncedSearch || undefined,
  };

  const { data, isLoading, isError, refetch } = useProducts(activeFilters);

  const { data: wishlist } = useQuery({
    queryKey: QUERY_KEYS.WISHLIST.MY,
    queryFn: wishlistService.getWishlist,
    enabled: isAuthenticated && !isAdmin && isInitialized,
  });

  const wishlistedIds = new Set(wishlist?.content?.map((i) => i.productId) ?? []);

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) => cartService.addItem({ productId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.MY });
      showSnackbar('Added to cart!', 'success');
    },
    onError: () => showSnackbar('Could not add to cart.', 'error'),
  });

  const wishlistMutation = useMutation<WishlistItemResponse | void, Error, string>({
    mutationFn: (productId: string) =>
      wishlistedIds.has(productId)
        ? wishlistService.removeFromWishlist(productId)
        : wishlistService.addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLIST.MY });
    },
    onError: () => showSnackbar('Could not update wishlist.', 'error'),
  });

  const handleFilterChange = (partial: Partial<ProductFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: 0 }));
  };

  const totalPages = data?.data.totalPages ?? 0;

  const filtersPanel = (
    <ProductFilters
      filters={filters}
      onChange={handleFilterChange}
      onReset={() => setFilters(DEFAULT_FILTERS)}
    />
  );

  return (
    <>
      <Helmet>
        <title>Products — CommerceHub</title>
      </Helmet>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Products
          </Typography>
          {isMobile && (
            <IconButton onClick={() => setFiltersOpen(true)} aria-label="Open filters">
              <FilterListIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 3 }}>
          {!isMobile && (
            <Box sx={{ width: 240, flexShrink: 0 }}>{filtersPanel}</Box>
          )}

          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flexGrow: 1 }}>
                <SearchBox
                  value={searchInput}
                  onChange={setSearchInput}
                  placeholder="Search products..."
                  fullWidth
                />
              </Box>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={filters.sort ?? 'createdAt,desc'}
                  label="Sort by"
                  onChange={(e) => handleFilterChange({ sort: e.target.value })}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {isError ? (
              <ErrorState onRetry={refetch} />
            ) : (
              <>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  {isLoading ? 'Loading...' : `${data?.data.totalElements ?? 0} products found`}
                </Typography>

                <Grid container spacing={2}>
                  {isLoading
                    ? Array.from({ length: 12 }).map((_, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                          <ProductCard loading />
                        </Grid>
                      ))
                    : (data?.data.content ?? []).map((product) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                          <ProductCard
                            product={product}
                            isWishlisted={wishlistedIds.has(product.id)}
                            onWishlistToggle={
                              isAuthenticated && !isAdmin
                                ? (id) => wishlistMutation.mutate(id)
                                : undefined
                            }
                            onAddToCart={
                              isAuthenticated && !isAdmin
                                ? (id) => addToCartMutation.mutate(id)
                                : undefined
                            }
                          />
                        </Grid>
                      ))}
                </Grid>

                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={(filters.page ?? 0) + 1}
                      onChange={(_, page) => handleFilterChange({ page: page - 1 })}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>

      <Drawer anchor="left" open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <Box sx={{ width: 280, p: 2 }}>{filtersPanel}</Box>
      </Drawer>
    </>
  );
}
