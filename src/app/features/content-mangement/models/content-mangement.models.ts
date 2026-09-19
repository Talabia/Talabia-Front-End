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
  createdAt: string;
}

export type OfferImageVariant = 'Card' | 'Detail' | 'Thumbnail';

/** Pre-generated image sizes; any variant may be missing. */
export type OfferImageVariants = Partial<Record<OfferImageVariant, string>>;

export interface OfferImage {
  url: string;
  publicId: string;
  variants: OfferImageVariants | null;
}

/** Mirrors backend UploadFileTypeEnum */
export enum UploadFileType {
  Image = 1,
  Pdf = 2,
  Excel = 3,
}

export interface OfferAttachment {
  url: string;
  publicId: string;
  fileName: string;
  fileType: UploadFileType;
  /** Populated for image attachments only. */
  variants: OfferImageVariants | null;
}

export interface VehicleModelCompatibility {
  vehicleModelId: number;
  vehicleModelName: string;
}

export interface VehicleCompatibility {
  vehicleMakerId: number;
  vehicleMakerName: string;
  models: VehicleModelCompatibility[];
}

/** Normalized response of GET AdminOffers/get/details */
export interface AdminOfferDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  createdFrom: string | null;
  createdAt: string;
  city: string;
  category: string;
  userId: string;
  userName: string;
  userEmail: string;
  profileLogo: string;
  phone: string;
  displayPhone: boolean;
  isNew: boolean;
  isFavorite: boolean;
  isActive: boolean;
  isOwner: boolean;
  /** Not returned by the details endpoint; merged from the list row. */
  isPromoted?: boolean;
  /** Legacy field, kept for backward compatibility with older responses. */
  vehicleMaker?: string;
  vehicleCompatibilities: VehicleCompatibility[];
  offerImages: OfferImage[];
  attachments: OfferAttachment[];
  lastRefreshedAt: string | null;
  isRefreshed: boolean;
}

/** Raw details payload before normalization (collections may be null, images may be legacy strings). */
export type AdminOfferDetailsResponse = Omit<
  AdminOfferDetails,
  'offerImages' | 'attachments' | 'vehicleCompatibilities'
> & {
  offerImages?: (OfferImage | string)[] | null;
  attachments?: OfferAttachment[] | null;
  vehicleCompatibilities?: VehicleCompatibility[] | null;
};

/** Minimal shape required by the promote/unpromote flow. */
export type PromotableOffer = Pick<AdminOffer, 'id' | 'title' | 'isPromoted'>;

/** Returns the requested variant when available, otherwise the original url. */
export function resolveOfferImageUrl(image: OfferImage, variant: OfferImageVariant): string {
  return image.variants?.[variant] || image.url;
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
