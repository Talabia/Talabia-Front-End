// Vehicle Types interfaces for API requests and responses

export interface VehicleType {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface CreateVehicleTypeRequest {
  nameAr: string;
  nameEn: string;
}

export interface EditVehicleTypeRequest {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface VehicleTypesListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface VehicleTypesListResponse {
  data: VehicleType[];
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

export interface DeleteVehicleTypeRequest {
  id: number;
}
