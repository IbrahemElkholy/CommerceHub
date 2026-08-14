import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number({ invalid_type_error: 'Price must be a number' }).min(0.01, 'Price must be greater than 0'),
  brandId: z.number().optional().nullable(),
  categoryIds: z.array(z.number()).min(1, 'At least one category is required'),
  images: z
    .array(
      z.object({
        url: z.string().url('Must be a valid URL'),
        altText: z.string().optional(),
        sortOrder: z.number().optional(),
        isPrimary: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  body: z.string().min(10, 'Review must be at least 10 characters').max(2000, 'Review is too long'),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type ReviewFormValues = z.infer<typeof reviewSchema>;
