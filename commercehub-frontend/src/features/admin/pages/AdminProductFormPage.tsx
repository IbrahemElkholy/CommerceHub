import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/features/products/services/productService';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { ROUTES } from '@/constants/routes';
import { useUiStore } from '@/store/uiStore';
import type { CreateProductRequest, UpdateProductRequest } from '@/features/products/types';

interface ProductFormValues {
  sku: string;
  name: string;
  description: string;
  price: string;
  brandId: string;
  categoryIds: string;
  imageUrl: string;
}

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showSnackbar = useUiStore((s) => s.showSnackbar);

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.DETAIL(id!),
    queryFn: () => productService.getProductById(id!),
    enabled: isEdit,
  });

  const { data: brands, isLoading: loadingBrands } = useQuery({
    queryKey: QUERY_KEYS.BRANDS.ALL,
    queryFn: () => productService.getBrands(),
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: QUERY_KEYS.CATEGORIES.TREE,
    queryFn: () => productService.getCategoryTree(),
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ProductFormValues>({
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      price: '',
      brandId: '',
      categoryIds: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku,
        name: product.name,
        description: product.description ?? '',
        price: String(product.price),
        brandId: product.brand ? String(product.brand.id) : '',
        categoryIds: product.categories.map((c) => c.id).join(','),
        imageUrl: product.images.find((i) => i.isPrimary)?.url ?? '',
      });
    }
  }, [product, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateProductRequest) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      showSnackbar('Product created.', 'success');
      navigate(ROUTES.ADMIN_PRODUCTS);
    },
    onError: () => showSnackbar('Could not create product.', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProductRequest) => productService.updateProduct(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.DETAIL(id!) });
      showSnackbar('Product updated.', 'success');
      navigate(ROUTES.ADMIN_PRODUCTS);
    },
    onError: () => showSnackbar('Could not update product.', 'error'),
  });

  const onSubmit = (values: ProductFormValues) => {
    const categoryIds = values.categoryIds
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    const images = values.imageUrl.trim()
      ? [{ url: values.imageUrl.trim(), isPrimary: true }]
      : undefined;

    if (isEdit) {
      updateMutation.mutate({
        sku: values.sku || undefined,
        name: values.name || undefined,
        description: values.description || undefined,
        price: values.price ? parseFloat(values.price) : undefined,
        brandId: values.brandId ? parseInt(values.brandId, 10) : undefined,
        categoryIds: categoryIds.length ? categoryIds : undefined,
        images,
      });
    } else {
      createMutation.mutate({
        sku: values.sku,
        name: values.name,
        description: values.description || undefined,
        price: parseFloat(values.price),
        brandId: values.brandId ? parseInt(values.brandId, 10) : undefined,
        categoryIds,
        images,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isDataLoading = (isEdit && loadingProduct) || loadingBrands || loadingCategories;

  if (isDataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const flatCategories = (cats: typeof categories): { id: number; label: string }[] => {
    if (!cats) return [];
    const result: { id: number; label: string }[] = [];
    const walk = (list: typeof cats, prefix = '') => {
      list?.forEach((c) => {
        result.push({ id: c.id, label: prefix + c.name });
        if (c.children?.length) walk(c.children, prefix + c.name + ' / ');
      });
    };
    walk(cats);
    return result;
  };

  return (
    <>
      <Helmet><title>{isEdit ? 'Edit Product' : 'Add Product'} — Admin</title></Helmet>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="text" onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}>← Back</Button>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {isEdit ? 'Edit Product' : 'Add Product'}
          </Typography>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Basic Info</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="SKU"
                {...register('sku', { required: 'SKU is required' })}
                error={!!errors.sku}
                helperText={errors.sku?.message}
                size="small"
              />
              <TextField
                label="Price (USD)"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                {...register('price', { required: 'Price is required' })}
                error={!!errors.price}
                helperText={errors.price?.message}
                size="small"
              />
            </Box>

            <TextField
              label="Name"
              {...register('name', { required: 'Name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
              size="small"
              fullWidth
            />

            <TextField
              label="Description"
              {...register('description')}
              multiline
              rows={3}
              size="small"
              fullWidth
            />

            <Divider />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Classification</Typography>

            <Controller
              name="brandId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Brand"
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">— No brand —</MenuItem>
                  {brands?.map((b) => (
                    <MenuItem key={b.id} value={String(b.id)}>{b.name}</MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="categoryIds"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Category"
                  size="small"
                  fullWidth
                  helperText="Select one category"
                >
                  <MenuItem value="">— No category —</MenuItem>
                  {flatCategories(categories).map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.label}</MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Divider />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Image</Typography>

            <TextField
              label="Primary Image URL"
              {...register('imageUrl')}
              size="small"
              fullWidth
              placeholder="https://..."
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
              <Button variant="outlined" onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isPending}>
                {isPending ? <CircularProgress size={20} /> : isEdit ? 'Save Changes' : 'Create Product'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
