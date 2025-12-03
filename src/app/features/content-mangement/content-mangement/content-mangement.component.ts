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
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { ContentMangementService } from '../services/content-mangement.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  AdminOffer,
  AdminOffersListRequest,
  AdminOffersListResponse,
  DateRangeDuration,
} from '../models/content-mangement.models';
import { Subject, takeUntil, timeout, distinctUntilChanged, debounceTime } from 'rxjs';

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
    TranslatePipe,
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
  selectedOffer: AdminOffer | null = null;

  pageReportTemplate: string = '';

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private currentRequest?: any;

  // Expose enum for template
  DateRangeDuration = DateRangeDuration;

  private readonly durationFilterOptionConfigs = [
    { labelKey: 'contentManagement.filters.duration.all', value: null },
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
    { labelKey: 'contentManagement.filters.status.all', value: null },
    { labelKey: 'contentManagement.filters.status.active', value: true },
    { labelKey: 'contentManagement.filters.status.inactive', value: false },
  ];

  private readonly promotedFilterOptionConfigs = [
    { labelKey: 'contentManagement.filters.promoted.all', value: null },
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
    this.viewDialogVisible = true;
    this.loading = true;

    this.contentManagementService
      .getAdminOfferById(offer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedOffer: AdminOffer) => {
          console.log('Offer details loaded:', detailedOffer);
          this.selectedOffer = detailedOffer;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.loading = false;
          this.viewDialogVisible = false;
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
  togglePromote(offer: AdminOffer): void {
    const newPromotedState = !offer.isPromoted;
    const actionText = newPromotedState
      ? this.t('contentManagement.button.promote')
      : this.t('contentManagement.button.unpromote');

    this.confirmationService.confirm({
      target: event?.currentTarget as EventTarget,
      message: this.t('contentManagement.confirm.togglePromote', {
        title: offer.title,
        action: actionText.toLowerCase(),
      }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('theme.button.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: newPromotedState
          ? 'contentManagement.button.promote'
          : 'contentManagement.button.unpromote',
        severity: newPromotedState ? 'success' : 'warning',
      },
      accept: () => {
        this.promoteOffer(offer, newPromotedState);
      },
    });
  }

  /**
   * Promote or unpromote offer
   */
  private promoteOffer(offer: AdminOffer, isPromoted: boolean): void {
    this.loading = true;

    this.contentManagementService
      .promoteAdminOffer({ offerId: offer.id, isPromoted })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          offer.isPromoted = isPromoted;
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: isPromoted
              ? this.t('contentManagement.notification.promoteSuccess')
              : this.t('contentManagement.notification.unpromoteSuccess'),
            life: 3000,
          });
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
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}
