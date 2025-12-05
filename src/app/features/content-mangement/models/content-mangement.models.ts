// Content Management (AdminOffers) interfaces for API requests and responses

export interface AdminOffer {
  id: string;
  title: string;
  description: string;
  price: number;
  vehicleMaker: string;
  category: string;
  city: string;
  companyOrUserName: string;
  userId: string;
  userName: string;
  userEmail: string;
  profileLogo: string;
  phone: string;
  displayPhone: boolean;
  isActive: boolean;
  isPromoted: boolean;
  isNew: boolean;
  isFavorite: boolean;
  offerImages: string[];
  lastRefreshedAt: string;
  isRefreshed: boolean;
  createdFrom: string;
}

export interface AdminOffersListRequest {
  fromDate?: string;
  toDate?: string;
  duration?: DateRangeDuration;
  searchKeyword?: string;
  isActive?: boolean;
  isPromoted?: boolean;
  pageSize: number;
  currentPage: number;
}

export interface AdminOffersListResponse {
  data: AdminOffer[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface PromoteOfferRequest {
  offerId: string;
  isPromoted: boolean;
  promotionImageUrl?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export enum DateRangeDuration {
  Last24Hours = 1,
  LastWeek = 2,
  LastMonth = 3,
}
