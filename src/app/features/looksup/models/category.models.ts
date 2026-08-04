// Categories interfaces for API requests and responses

export interface Category {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface CreateCategoryRequest {
  nameAr: string;
  nameEn: string;
}

export interface EditCategoryRequest {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface CategoriesListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface CategoriesListResponse {
  data: Category[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DeleteCategoryRequest {
  id: number;
}
