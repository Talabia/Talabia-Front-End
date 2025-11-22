/**
 * User Verification Status Enum
 */
export enum VerificationStatus {
  Pending = 1,
  UnderReview = 2,
  Approved = 3,
  Rejected = 4,
  RequiresUpdate = 5 // When admin requests changes
}

/**
 * User Verification (List Item)
 */
export interface UserVerification {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  commercialRegistrationNumber: string;
  location: string;
  city: string;
  status: string;
  submittedAt: string;
}

/**
 * Verification Log Entry
 */
export interface VerificationLogEntry {
  id: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  createdAt: string;
}

/**
 * User Verification Details
 */
export interface UserVerificationDetails {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  city: string;
  commercialRegistrationNumber: string;
  location: string;
  taxCertificateUrl: string;
  storeImageUrl: string;
  status: string;
  rejectionReason: string;
  adminNotes: string;
  recentLogs: VerificationLogEntry[];
}

/**
 * Verification Details Response
 */
export interface VerificationDetailsResponse {
  found: boolean;
  details: UserVerificationDetails;
}

/**
 * Verifications List Request
 */
export interface VerificationsListRequest {
  status?: number;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  pageSize: number;
  currentPage: number;
}

/**
 * Verifications List Response
 */
export interface VerificationsListResponse {
  data: UserVerification[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Review Verification Request
 */
export interface ReviewVerificationRequest {
  verificationId: string;
  status: VerificationStatus;
  rejectionReason?: string;
  adminNotes?: string;
}
