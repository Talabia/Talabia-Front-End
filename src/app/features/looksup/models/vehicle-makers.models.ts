// Vehicle Makers interfaces for API requests and responses

export interface VehicleMaker {
  id: number;
  nameAr: string;
  nameEn: string;
  logo: string;
}

export interface CreateVehicleMakerRequest {
  nameAr: string;
  nameEn: string;
  logo: string;
}

export interface EditVehicleMakerRequest {
  id: number;
  nameAr: string;
  nameEn: string;
  logo: string;
}

export interface VehicleMakersListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface VehicleMakersListResponse {
  data: VehicleMaker[];
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

export interface DeleteVehicleMakerRequest {
  id: number;
}

export interface ImageUploadRequest {
  filePath: string;
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    fileName: string;
  };
}
