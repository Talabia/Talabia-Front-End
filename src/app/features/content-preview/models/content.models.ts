// Content interfaces for API requests and responses

export interface AdminContent {
  id: number;
  type: ContentType;
  title: string;
  titleAr?: string;
  titleEn?: string;
  contentAr?: string;
  contentEn?: string;
  isActive: boolean;
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
  isActive: boolean;
  createdAt: string;
}

export interface ChangeContentStatusRequest {
  id: number;
  isActive: boolean;
}

export enum ContentType {
  UsagePolicy = 1,
  AboutUs = 2,
  TermsAndConditions = 3
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
