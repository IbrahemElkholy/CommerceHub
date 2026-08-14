export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductImageResponse {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface CategorySummaryResponse {
  id: number;
  name: string;
  slug: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  children: CategoryResponse[];
}

export interface BrandResponse {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface DimensionsResponse {
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
}

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  brand: BrandResponse | null;
  categories: CategorySummaryResponse[];
  images: ProductImageResponse[];
  dimensions: DimensionsResponse | null;
  availableStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummaryResponse {
  id: string;
  sku: string;
  name: string;
  price: number;
  status: ProductStatus;
  primaryImageUrl: string | null;
  brandName: string | null;
  availableStock: number;
}

export interface ProductFilterParams {
  page?: number;
  size?: number;
  sort?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  status?: ProductStatus;
}

export interface ProductImageRequest {
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  brandId?: number;
  categoryIds: number[];
  images?: ProductImageRequest[];
}

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  brandId?: number;
  categoryIds?: number[];
  images?: ProductImageRequest[];
}

export interface UpdateProductStatusRequest {
  status: ProductStatus;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: number;
}

export interface CreateBrandRequest {
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface ReviewResponse {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  title: string;
  body: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  title: string;
  body: string;
}
