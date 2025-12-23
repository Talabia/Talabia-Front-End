// Notification interfaces for API requests and responses

export enum AdminNotificationTargetAudience {
  AllUsers = 1,
  VerifiedAccounts = 2,
  PremiumAccounts = 3,
  SpecificCity = 4,
  SpecificUsers = 5,
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
  userIds?: string[];
}

export interface NotificationsListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
  fromDate?: string;
  toDate?: string;
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

// Admin Users interfaces for Specific Users targeting
export interface AdminUser {
  id: string;
  companyName: string;
  userName: string;
  phone: string;
  email: string;
  city: string;
  joinDate: string;
  isPremium: boolean;
  isBlocked: boolean;
  isVerified: boolean;
}

export interface AdminUsersListRequest {
  filter?: number;
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
  cityId?: number;
}

export interface AdminUsersListResponse {
  data: AdminUser[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}
