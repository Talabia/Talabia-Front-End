// Advertisement interfaces for API requests and responses

export enum StatusTypeEnum {
  Active = 1,
  Inactive = 2,
}

export interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  status: StatusTypeEnum;
}

export interface CreateAdvertisementRequest {
  title: string;
  imageUrl: string;
  status: StatusTypeEnum;
}

export interface EditAdvertisementRequest {
  id: string;
  title: string;
  imageUrl: string;
  status: StatusTypeEnum;
}

export interface AdvertisementsListRequest {
  status?: StatusTypeEnum | null;
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface AdvertisementsListResponse {
  data: Advertisement[];
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

export interface DeleteAdvertisementRequest {
  id: string;
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
