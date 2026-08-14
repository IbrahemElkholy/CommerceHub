export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  path?: string;
  traceId?: string;
  timestamp?: string;
  fieldErrors: FieldError[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}
