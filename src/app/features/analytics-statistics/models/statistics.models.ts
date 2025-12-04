// Shared Types
export interface ChartDataPoint {
  label: string;
  value: number;
}

export enum ChartFilter {
  Daily = 1,
  Weekly = 2,
  Monthly = 3
}

export interface ChartData {
  labels: string[];
  datasets: any[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: any;
  scales?: any;
  elements?: any;
}

// Dashboard Overview
export interface DashboardOverview {
  dailyActiveUsers: number;
  dailyActiveUsersChangePercent: number;
  newOffersToday: number;
  newOffersTodayChangePercent: number;
  newOrdersToday: number;
  newOrdersTodayChangePercent: number;
  totalActiveOffers: number;
  totalActiveOrders: number;
  totalRegisteredUsers: number;
  premiumUsersCount: number;
  promotedOffersCount: number;
  verifiedUsersPercentage: number;
  averageOfferPrice: number;
}

// Offers Chart
export interface OffersChartResponse {
  chartData: ChartDataPoint[];
  totalOffers: number;
  activeOffers: number;
  inactiveOffers: number;
  promotedOffers: number;
}

// Orders Chart
export interface OrdersChartResponse {
  chartData: ChartDataPoint[];
  totalOrders: number;
  activeOrders: number;
  inactiveOrders: number;
}

// Cities
export interface CityStats {
  cityName: string;
  offersCount: number;
  ordersCount: number;
  usersCount: number;
  totalActivity: number;
}

export interface CityStatsResponse {
  cities: CityStats[];
}

// Users
export interface UserStats {
  userId: string;
  userName: string;
  profileImage?: string;
  offersCount: number;
  ordersCount: number;
  commentsCount: number;
  followersCount: number;
  isPremium: boolean;
  totalActivity: number;
}

export interface UserStatsResponse {
  users: UserStats[];
}

// Vehicle Analytics
export interface VehicleTypeData {
  label: string;
  value: number;
}

export interface VehicleAnalyticsResponse {
  vehicleTypes: VehicleTypeData[];
  vehicleMakers: VehicleTypeData[];
  vehicleModels: VehicleTypeData[];
  manufactureYears: VehicleTypeData[];
  averagePriceByType: Record<string, number>;
}

// Category Performance
export interface CategoryData {
  label: string;
  value: number;
}

export interface CategoryPerformanceResponse {
  offersByCategory: CategoryData[];
  ordersByCategory: CategoryData[];
}

// User Engagement
export interface UserEngagementData {
  label: string;
  value: number;
}

export interface UserEngagementResponse {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  onlineUsers: number;
  newUserRegistrations: UserEngagementData[];
  commentsPerDay: UserEngagementData[];
  favoritesPerDay: UserEngagementData[];
  followsPerDay: UserEngagementData[];
}

// Review Analytics
export interface ReviewAnalyticsResponse {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
  reviewsOverTime: ChartDataPoint[];
  mostReviewedOffers: ReviewedItem[];
  mostReviewedOrders: ReviewedItem[];
  topRatedUsers: TopRatedUser[];
}

export interface ReviewedItem {
  itemId: string;
  itemTitle: string;
  reviewCount: number;
  averageRating: number;
}

export interface TopRatedUser {
  userId: string;
  userName: string;
  profileImage?: string;
  reviewCount: number;
  averageRating: number;
}
