// Vehicle Model interfaces
export interface VehicleModel {
  id: number;
  nameAr: string;
  nameEn: string;
  vehicleMaker: string;
}

// API Request interfaces
export interface CreateVehicleModelRequest {
  nameAr: string;
  nameEn: string;
  makerId: number;
}

export interface EditVehicleModelRequest {
  id: number;
  nameAr: string;
  nameEn: string;
  makerId: number;
}

export interface VehicleModelsListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

// API Response interfaces
export interface VehicleModelsListResponse {
  data: VehicleModel[];
  totalCount: number;
  totalRecords: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface VehicleModelDetailsResponse {
  id: number;
  nameAr: string;
  nameEn: string;
  makerId: number;
  vehicleMaker: string;
}

// Lookup interfaces
export interface VehicleMakerLookup {
  id: number;
  name: string;
}
