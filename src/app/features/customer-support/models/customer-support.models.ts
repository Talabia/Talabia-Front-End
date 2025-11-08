// Customer Support (ContactUs) interfaces for API requests and responses

export interface ContactUs {
  id: string;
  name: string;
  phone: string;
  message: string;
  createdAt: string;
  isRead?: boolean;
}

export interface ContactUsListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface ContactUsListResponse {
  data: ContactUs[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface MarkReadRequest {
  id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
