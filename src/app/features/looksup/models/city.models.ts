// City interfaces for API requests and responses

export interface City {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface CreateCityRequest {
  nameAr: string;
  nameEn: string;
}

export interface EditCityRequest {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface CitiesListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface CitiesListResponse {
  data: City[];
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

export interface DeleteCityRequest {
  id: number;
}
