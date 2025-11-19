// Reports interfaces for API requests and responses

export interface Report {
  id: string;
  reportType: string;
  status: string;
  description: string;
  reportedItemId: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reportReasonId: number;
  reportReasonName: string;
  adminNotes: string;
  actionTaken: string;
  reviewerId: string;
  reviewerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsListRequest {
  reportType?: ReportTypeEnum;
  reportReasonId?: number;
  status?: ReportStatusEnum;
  fromDate?: string;
  toDate?: string;
  pageSize: number;
  currentPage: number;
  searchKeyword?: string;
}

export interface ReportsListResponse {
  data: Report[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface ChangeStatusRequest {
  reportId: string;
  status: ReportStatusEnum;
  adminNotes: string;
  actionTaken: string;
}

export interface BulkChangeStatusRequest {
  reportIds: string[];
  status: ReportStatusEnum;
  adminNotes: string;
  actionTaken: string;
}

export interface ReportReason {
  id: number;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export enum ReportStatusEnum {
  Pending = 1,
  UnderReview = 2,
  Resolved = 3,
  Rejected = 4,
  Dismissed = 5
}

export enum ReportTypeEnum {
  Offer = 1,
  Order = 2,
  Chat = 3
}

// Filter options for dropdowns
export interface FilterOption {
  label: string;
  value: number | null;
}

export interface StatusFilterOption {
  label: string;
  value: ReportStatusEnum | null;
}

export interface TypeFilterOption {
  label: string;
  value: ReportTypeEnum | null;
}
