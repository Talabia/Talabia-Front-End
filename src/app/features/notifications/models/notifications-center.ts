// Notification interfaces for API requests and responses

export enum AdminNotificationTargetAudience {
  AllUsers = 1,
  VerifiedAccounts = 2,
  PremiumAccounts = 3,
  SpecificCity = 4
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  totalDevices: number;
  successCount: number;
  failureCount: number;
  sentAt: string;
  targetAudience: string | null;
}

export interface SendNotificationRequest {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  targetAudience: AdminNotificationTargetAudience;
  cityId?: number;
}

export interface NotificationsListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
  startDate?: string;
  endDate?: string;
}

export interface NotificationsListResponse {
  data: Notification[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface City {
  id: number;
  nameEn: string;
  nameAr: string;
}

export interface CitiesListResponse {
  data: City[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}
