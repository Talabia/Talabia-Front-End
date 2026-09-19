import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatePicker } from 'primeng/datepicker';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { ContentMangementService } from '../services/content-mangement.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  AdminOffer,
  AdminOfferDetails,
  AdminOffersListRequest,
  AdminOffersListResponse,
  DateRangeDuration,
  OfferAttachment,
  PromotableOffer,
  resolveOfferImageUrl,
  UploadFileType,
} from '../models/content-mangement.models';
import { Subject, takeUntil, timeout, distinctUntilChanged, debounceTime } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { Image } from 'primeng/image';
import { DateTimePipe } from '../../../shared/pipes/date-time.pipe';
import { NgxDocViewerModule } from 'ngx-doc-viewer';

interface OfferImageView {
  thumbnailSrc: string;
  previewSrc: string;
}

type AttachmentKind = 'image' | 'pdf' | 'excel' | 'other';

interface OfferAttachmentView {
  url: string;
  publicId: string;
  fileName: string;
  extension: string;
  kind: AttachmentKind;
  icon: string;
  /** Small image shown in the list (images only). */
  thumbnailSrc: string | null;
  /** Full-size source used by the in-app preview (images, PDFs and Excel). */
  previewSrc: string | null;
  canPreview: boolean;
  /** Opening in a new tab is only useful for types the browser can render but we don't preview inline. */
  canOpenInNewTab: boolean;
}

/** ngx-doc-viewer engine per previewable kind. */
type DocViewerEngine = 'pdf' | 'office';

interface AttachmentPreview {
  attachment: OfferAttachmentView;
  /** null for images, which are rendered with a plain <img>. */
  docViewer: DocViewerEngine | null;
}

/**
 * PDFs use the browser's native viewer (no third party involved).
 * Excel uses Microsoft Office Online, which fetches the public file URL itself.
 */
const DOC_VIEWER_BY_KIND: Partial<Record<AttachmentKind, DocViewerEngine>> = {
  pdf: 'pdf',
  excel: 'office',
};

const ATTACHMENT_KIND_BY_FILE_TYPE: Record<UploadFileType, AttachmentKind> = {
  [UploadFileType.Image]: 'image',
  [UploadFileType.Pdf]: 'pdf',
  [UploadFileType.Excel]: 'excel',
};

/** Fallback when the backend sends an unknown/missing fileType. */
const ATTACHMENT_KIND_BY_EXTENSION: Record<string, AttachmentKind> = {
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  bmp: 'image',
  svg: 'image',
  avif: 'image',
  pdf: 'pdf',
  xls: 'excel',
  xlsx: 'excel',
  csv: 'excel',
};

const ATTACHMENT_ICONS: Record<AttachmentKind, string> = {
  image: 'pi pi-image',
  pdf: 'pi pi-file-pdf',
  excel: 'pi pi-file-excel',
  other: 'pi pi-file',
};

@Component({
  selector: 'app-content-mangement',
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    TagModule,
    Select,
    InputIcon,
    IconField,
    InputTextModule,
    FormsModule,
    CommonModule,
    DatePicker,
    ConfirmPopupModule,
    FileUploadModule,
    TranslatePipe,
    TooltipModule,
    Image,
    DateTimePipe,
    NgxDocViewerModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './content-mangement.component.html',
  styleUrl: './content-mangement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentMangementComponent implements OnInit, OnDestroy {
  // Data properties
  offers: AdminOffer[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Filter properties
  searchKeyword: string = '';
  selectedDuration: DateRangeDuration | null = null;
  rangeDates: Date[] | null = null;
  selectedIsActive: boolean | null = null;
  selectedIsPromoted: boolean | null = null;

  // Filter options
  durationFilterOptions: { label: string; value: DateRangeDuration | null }[] = [];
  activeFilterOptions: { label: string; value: boolean | null }[] = [];
  promotedFilterOptions: { label: string; value: boolean | null }[] = [];

  // Dialog properties
  viewDialogVisible: boolean = false;
  selectedOffer: (AdminOfferDetails & { isPromoted: boolean }) | null = null;
  selectedOfferImages: OfferImageView[] = [];
  selectedOfferAttachments: OfferAttachmentView[] = [];
  downloadingAttachmentIds = new Set<string>();
  attachmentPreview: AttachmentPreview | null = null;
  attachmentPreviewVisible: boolean = false;

  // Promotion dialog properties
  promoteDialogVisible: boolean = false;
  selectedOfferForPromotion: PromotableOffer | null = null;
  uploadedPromotionImageUrl: string = '';
  isPromotionImageUploading: boolean = false;

  pageReportTemplate: string = '';

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private currentRequest?: any;

  // Expose enum for template
  DateRangeDuration = DateRangeDuration;

  private readonly durationFilterOptionConfigs = [
    {
      labelKey: 'contentManagement.filters.duration.last24Hours',
      value: DateRangeDuration.Last24Hours,
    },
    { labelKey: 'contentManagement.filters.duration.lastWeek', value: DateRangeDuration.LastWeek },
    {
      labelKey: 'contentManagement.filters.duration.lastMonth',
      value: DateRangeDuration.LastMonth,
    },
  ];

  private readonly activeFilterOptionConfigs = [
    { labelKey: 'contentManagement.filters.status.active', value: true },
    { labelKey: 'contentManagement.filters.status.inactive', value: false },
  ];

  private readonly promotedFilterOptionConfigs = [
    { labelKey: 'contentManagement.filters.promoted.promoted', value: true },
    { labelKey: 'contentManagement.filters.promoted.notPromoted', value: false },
  ];

  constructor(
    private contentManagementService: ContentMangementService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private languageService: LanguageService
  ) {
    this.pageReportTemplate = this.t('table.currentPageReport');
    this.setupSearchDebounce();
    this.buildFilterOptions();
    this.observeLanguageChanges();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.buildFilterOptions();
      this.pageReportTemplate = this.t('table.currentPageReport');
      this.cdr.markForCheck();
    });
  }

  private buildFilterOptions(): void {
    this.durationFilterOptions = this.durationFilterOptionConfigs.map((option) => ({
      label: this.t(option.labelKey),
      value: option.value,
    }));

    this.activeFilterOptions = this.activeFilterOptionConfigs.map((option) => ({
      label: this.t(option.labelKey),
      value: option.value,
    }));

    this.promotedFilterOptions = this.promotedFilterOptionConfigs.map((option) => ({
      label: this.t(option.labelKey),
      value: option.value,
    }));
  }

  ngOnInit(): void {
    this.loadOffers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Force stop any pending requests
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }
    this.loading = false;
  }

  /**
   * Setup search debounce
   */
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        console.log('Search debounce triggered:', searchTerm);
        const trimmedTerm = searchTerm.trim();

        // If search is empty, load immediately without debounce
        if (!trimmedTerm) {
          console.log('Empty search, loading all offers');
          this.searchKeyword = '';
          this.first = 0;
          this.currentPage = 1;
          this.loadOffers();
          return;
        }

        // For non-empty search, use minimal debounce
        console.log('Non-empty search, setting keyword:', trimmedTerm);
        this.searchKeyword = trimmedTerm;
        this.first = 0;
        this.currentPage = 1;

        setTimeout(() => {
          if (this.searchKeyword === trimmedTerm) {
            console.log('Executing search after timeout:', this.searchKeyword);
            this.loadOffers();
          }
        }, 300);
      });
  }

  /**
   * Load offers with pagination and filters
   */
  loadOffers(): void {
    // Cancel previous request if still pending
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }

    this.loading = true;

    const request: AdminOffersListRequest = {
      pageSize: this.rows,
      currentPage: this.currentPage,
      searchKeyword: this.searchKeyword?.trim() || undefined,
      duration: this.selectedDuration ?? undefined,
      isActive: this.selectedIsActive ?? undefined,
      isPromoted: this.selectedIsPromoted ?? undefined,
      fromDate: this.rangeDates?.[0]?.toISOString() || undefined,
      toDate: this.rangeDates?.[1]?.toISOString() || undefined,
    };

    console.log('Loading offers with filters:', request);

    this.currentRequest = this.contentManagementService
      .getAdminOffersList(request)
      .pipe(timeout(30000), takeUntil(this.destroy$))
      .subscribe({
        next: (response: AdminOffersListResponse) => {
          try {
            this.offers = response.data || [];
            this.totalRecords = response.totalCount || 0;
            this.loading = false;
            this.currentRequest = undefined;
            this.cdr.detectChanges();
          } catch (error) {
            console.error('Error processing response:', error);
            this.loading = false;
            this.currentRequest = undefined;
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          console.error('API Error:', error);
          this.loading = false;
          this.offers = [];
          this.totalRecords = 0;
          this.currentRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('contentManagement.notification.loadError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Handle search input
   */
  onSearch(event: any): void {
    const searchTerm = event.target.value || '';
    console.log('Search input:', searchTerm);
    this.searchSubject.next(searchTerm);
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.first = 0;
    this.currentPage = 1;
    this.loadOffers();
  }

  /**
   * Handle date range changes - only filter when both dates are selected
   */
  onDateRangeChange(event: any): void {
    // Only trigger filter when both start and end dates are selected
    if (
      this.rangeDates &&
      this.rangeDates.length === 2 &&
      this.rangeDates[0] &&
      this.rangeDates[1]
    ) {
      this.onFilterChange();
    }
  }

  /**
   * Handle pagination change
   */
  pageChange(event: any): void {
    if (this.loading) {
      return;
    }

    this.first = event.first || 0;
    this.rows = event.rows || 10;
    this.currentPage = Math.floor(this.first / this.rows) + 1;

    this.loadOffers();
  }

  /**
   * Show view dialog with offer details
   */
  showViewDialog(offer: AdminOffer): void {
    this.selectedOffer = null; // Clear previous data
    this.loading = true;

    this.contentManagementService
      .getAdminOfferById(offer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedOffer: AdminOfferDetails) => {
          console.log('Offer details loaded:', detailedOffer);
          // The details endpoint doesn't return isPromoted, so keep the list row's value
          this.selectedOffer = {
            ...detailedOffer,
            isPromoted: detailedOffer.isPromoted ?? offer.isPromoted,
          };
          this.selectedOfferImages = detailedOffer.offerImages.map((image) => ({
            thumbnailSrc: resolveOfferImageUrl(image, 'Thumbnail'),
            previewSrc: resolveOfferImageUrl(image, 'Detail'),
          }));
          this.selectedOfferAttachments = detailedOffer.attachments.map((attachment) =>
            this.toAttachmentView(attachment)
          );
          this.viewDialogVisible = true; // Show dialog only after data is loaded
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('contentManagement.notification.detailsError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Toggle promote/unpromote offer
   */
  togglePromote(offer: PromotableOffer, event?: Event): void {
    if (offer.isPromoted) {
      // For unpromoting, show confirmation popup like delete
      this.confirmUnpromote(event!, offer);
    } else {
      // For promoting, show dialog with image upload
      this.showPromoteDialog(offer);
    }
  }

  /**
   * Show promote dialog with image upload
   */
  showPromoteDialog(offer: PromotableOffer): void {
    this.selectedOfferForPromotion = offer;
    this.uploadedPromotionImageUrl = '';
    this.promoteDialogVisible = true;
  }

  /**
   * Confirm unpromote with popup
   */
  confirmUnpromote(event: Event, offer: PromotableOffer): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t('contentManagement.confirm.unpromoteMessage', { title: offer.title }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('theme.button.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.t('contentManagement.button.unpromote'),
        severity: 'warning',
      },
      accept: () => {
        this.unpromoteOffer(offer);
      },
    });
  }

  /**
   * Handle promotion image upload
   */
  onPromotionImageUpload(event: FileSelectEvent): void {
    const file = event.files[0];
    if (!file) return;

    this.isPromotionImageUploading = true;

    this.contentManagementService
      .uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (imageUrl: string) => {
          this.uploadedPromotionImageUrl = imageUrl;
          this.isPromotionImageUploading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('contentManagement.notification.imageUploadSuccess'),
            life: 3000,
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.isPromotionImageUploading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('contentManagement.notification.imageUploadError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Remove uploaded promotion image
   */
  removePromotionImage(): void {
    this.uploadedPromotionImageUrl = '';
  }

  /**
   * Confirm and promote offer with image
   */
  confirmPromote(): void {
    if (!this.selectedOfferForPromotion) return;

    if (!this.uploadedPromotionImageUrl) {
      this.messageService.add({
        severity: 'warn',
        summary: this.t('common.warning'),
        detail: this.t('contentManagement.validation.imageRequired'),
        life: 3000,
      });
      return;
    }

    this.promoteOffer(this.selectedOfferForPromotion, true, this.uploadedPromotionImageUrl);
  }

  /**
   * Cancel promote dialog
   */
  cancelPromoteDialog(): void {
    this.promoteDialogVisible = false;
    this.selectedOfferForPromotion = null;
    this.uploadedPromotionImageUrl = '';
  }

  /**
   * Promote offer with image
   */
  private promoteOffer(
    offer: PromotableOffer,
    isPromoted: boolean,
    promotionImageUrl?: string
  ): void {
    this.loading = true;

    const request = {
      offerId: offer.id,
      isPromoted,
      promotionImageUrl: promotionImageUrl || undefined,
    };

    this.contentManagementService
      .promoteAdminOffer(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          offer.isPromoted = isPromoted;
          this.loading = false;
          this.promoteDialogVisible = false;
          this.selectedOfferForPromotion = null;
          this.uploadedPromotionImageUrl = '';
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('contentManagement.notification.promoteSuccess'),
            life: 3000,
          });
          this.loadOffers(); // Reload to get updated data
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('contentManagement.notification.promoteError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Unpromote offer
   */
  private unpromoteOffer(offer: PromotableOffer): void {
    this.loading = true;

    this.contentManagementService
      .promoteAdminOffer({ offerId: offer.id, isPromoted: false })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          offer.isPromoted = false;
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('contentManagement.notification.unpromoteSuccess'),
            life: 3000,
          });
          this.loadOffers(); // Reload to get updated data
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('contentManagement.notification.promoteError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Confirm and delete offer
   */
  confirmDelete(event: Event, offer: AdminOffer): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t('contentManagement.confirm.deleteMessage', { title: offer.title }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('theme.button.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.t('contentManagement.button.delete'),
        severity: 'danger',
      },
      accept: () => {
        this.deleteOffer(offer.id);
      },
    });
  }

  /**
   * Delete offer
   */
  private deleteOffer(offerId: string): void {
    this.loading = true;

    this.contentManagementService
      .deleteAdminOffer(offerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('contentManagement.notification.deleteSuccess'),
            life: 3000,
          });
          this.loadOffers();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('contentManagement.notification.deleteError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Get promoted status severity for tags
   */
  getPromotedSeverity(isPromoted: boolean): string {
    return isPromoted ? 'success' : 'secondary';
  }

  /**
   * Get promoted status text
   */
  getPromotedText(isPromoted: boolean): string {
    return isPromoted
      ? this.t('contentManagement.status.promoted')
      : this.t('contentManagement.status.notPromoted');
  }

  /**
   * Get active status severity for tags
   */
  getActiveSeverity(isActive: boolean): string {
    return isActive ? 'success' : 'danger';
  }

  /**
   * Get active status text
   */
  getActiveText(isActive: boolean): string {
    return isActive
      ? this.t('contentManagement.status.active')
      : this.t('contentManagement.status.inactive');
  }

  /**
   * Close view dialog
   */
  closeViewDialog(): void {
    this.viewDialogVisible = false;
    this.selectedOffer = null;
    this.selectedOfferImages = [];
    this.selectedOfferAttachments = [];
    this.closeAttachmentPreview();
  }

  /**
   * Download an attachment under its original file name.
   * Cross-origin URLs ignore the `download` attribute, so the file is fetched as a blob.
   * Native fetch is used to bypass HttpClient interceptors (no auth header to a third-party host).
   * Falls back to opening the file in a new tab if the fetch fails (e.g. CORS).
   */
  async downloadAttachment(attachment: OfferAttachmentView): Promise<void> {
    if (this.downloadingAttachmentIds.has(attachment.publicId)) return;

    this.downloadingAttachmentIds.add(attachment.publicId);
    this.cdr.markForCheck();

    try {
      const response = await fetch(attachment.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error('Attachment download failed, opening in a new tab instead:', error);
      window.open(attachment.url, '_blank', 'noopener');
    } finally {
      this.downloadingAttachmentIds.delete(attachment.publicId);
      this.cdr.markForCheck();
    }
  }

  /**
   * Preview images, PDFs and Excel files inside the app. Other types have no preview action.
   */
  previewAttachment(attachment: OfferAttachmentView): void {
    if (!attachment.canPreview || !attachment.previewSrc) return;

    this.attachmentPreview = {
      attachment,
      docViewer: DOC_VIEWER_BY_KIND[attachment.kind] ?? null,
    };
    this.attachmentPreviewVisible = true;
    this.cdr.markForCheck();
  }

  closeAttachmentPreview(): void {
    this.attachmentPreviewVisible = false;
    this.attachmentPreview = null;
  }

  openAttachmentInNewTab(attachment: OfferAttachmentView): void {
    window.open(attachment.url, '_blank', 'noopener');
  }

  private toAttachmentView(attachment: OfferAttachment): OfferAttachmentView {
    const rawName = attachment.fileName || attachment.publicId?.split('/').pop() || '';
    const nameExtension = this.getFileExtension(rawName);
    const urlExtension = this.getFileExtension(attachment.url);
    const extension = nameExtension || urlExtension;
    const kind = this.resolveAttachmentKind(attachment.fileType, extension);

    // Make sure the downloaded file keeps a usable extension
    let fileName = rawName || this.t('contentManagement.attachment.file');
    if (rawName && !nameExtension && urlExtension) {
      fileName = `${rawName}.${urlExtension}`;
    }

    // Only preview public http(s) URLs; they are bound to <img>/<object>/<iframe>
    const isSafeUrl = /^https?:\/\//i.test(attachment.url);
    const imageSource = { url: attachment.url, publicId: attachment.publicId, variants: attachment.variants };
    const canPreview = isSafeUrl && kind !== 'other';

    return {
      url: attachment.url,
      publicId: attachment.publicId || attachment.url,
      fileName,
      extension: extension.toUpperCase(),
      kind,
      icon: ATTACHMENT_ICONS[kind],
      thumbnailSrc: kind === 'image' && isSafeUrl ? resolveOfferImageUrl(imageSource, 'Thumbnail') : null,
      previewSrc: !canPreview
        ? null
        : kind === 'image'
        ? resolveOfferImageUrl(imageSource, 'Detail')
        : attachment.url,
      canPreview,
      // Browsers can't render Excel (opening the raw URL just downloads it); it's previewed via Office Online instead
      canOpenInNewTab: kind === 'pdf' || kind === 'other',
    };
  }

  private resolveAttachmentKind(fileType: number | null | undefined, extension: string): AttachmentKind {
    const byType = fileType != null ? ATTACHMENT_KIND_BY_FILE_TYPE[fileType as UploadFileType] : undefined;
    return byType ?? ATTACHMENT_KIND_BY_EXTENSION[extension] ?? 'other';
  }

  private getFileExtension(value: string | null | undefined): string {
    const name = (value ?? '').split(/[?#]/)[0].split('/').pop() ?? '';
    const dotIndex = name.lastIndexOf('.');
    return dotIndex > 0 ? name.slice(dotIndex + 1).toLowerCase() : '';
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}
