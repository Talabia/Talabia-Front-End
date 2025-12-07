// Content interfaces for API requests and responses

export interface AdminContent {
  id: number;
  type: ContentType;
  title: string;
  titleAr?: string;
  titleEn?: string;
  contentAr?: string;
  contentEn?: string;
  createdAt: string;
}

export interface CreateAdminContentRequest {
  type: ContentType;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
}

export interface EditAdminContentRequest {
  id: number;
  type: ContentType;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
}

export interface AdminContentListRequest {
  type?: ContentType;
  pageSize: number;
  currentPage: number;
}

export interface AdminContentListResponse {
  data: AdminContent[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminContentDetailsResponse {
  id: number;
  type: ContentType;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  createdAt: string;
}

export enum ContentType {
  UsagePolicy = 1,
  AboutUs = 2,
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
