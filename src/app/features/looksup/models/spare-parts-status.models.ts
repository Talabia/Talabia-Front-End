// Spare Parts Status interfaces for API requests and responses

export interface SparePartsStatus {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface CreateSparePartsStatusRequest {
  nameAr: string;
  nameEn: string;
}

export interface EditSparePartsStatusRequest {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface SparePartsStatusListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface SparePartsStatusListResponse {
  data: SparePartsStatus[];
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

export interface DeleteSparePartsStatusRequest {
  id: number;
}
