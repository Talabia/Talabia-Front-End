// Theme interfaces for API requests and responses

export interface Theme {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface CreateThemeRequest {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface EditThemeRequest {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface ThemesListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface ThemesListResponse {
  data: Theme[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SetActiveRequest {
  id: number;
  status: boolean;
}

export interface SetDefaultRequest {
  id: number;
}
