// User Account Management interfaces for API requests and responses

// User data from list endpoint
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
}

// User metadata from details endpoint
export interface UserMetaData {
  followersCount: number;
  followingCount: number;
  averageRating: number;
}

// Detailed user data from details endpoint
export interface AdminUserDetails {
  id: string;
  companyName: string;
  userName: string;
  phone: string;
  email: string;
  isFollowing: boolean;
  profileImage: string;
  metaData: UserMetaData;
}

export interface UsersListRequest {
  cityId?: number;
  filter?: UserTypeFilterEnum;
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface UsersListResponse {
  data: AdminUser[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface BanUserRequest {
  userId: string;
  block: boolean;
}

export interface PremiumUserRequest {
  userId: string;
  isPremium: boolean;
}

export enum UserTypeFilterEnum {
  Premium = 1,
  Banned = 2
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
