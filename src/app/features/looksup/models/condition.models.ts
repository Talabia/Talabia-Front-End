// Condition interfaces for API requests and responses

export interface Condition {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface CreateConditionRequest {
  nameAr: string;
  nameEn: string;
}

export interface EditConditionRequest {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface ConditionsListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface ConditionsListResponse {
  data: Condition[];
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

export interface DeleteConditionRequest {
  id: number;
}
