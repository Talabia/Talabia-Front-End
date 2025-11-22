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
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CommonModule } from '@angular/common';
import { UserVerificationsService } from '../services/user-verifications.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import {
  UserVerification,
  UserVerificationDetails,
  VerificationsListRequest,
  VerificationsListResponse,
  VerificationStatus,
  ReviewVerificationRequest
} from '../models/user-verifications.models';
import { Subject, takeUntil, timeout, distinctUntilChanged } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-user-verifications',
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
    ReactiveFormsModule,
    CommonModule,
    ConfirmPopupModule,
    TranslatePipe,
    DatePickerModule,
    TextareaModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-verifications.component.html',
  styleUrl: './user-verifications.component.scss'
})
export class UserVerificationsComponent implements OnInit, OnDestroy {
  // Data properties
  verifications: UserVerification[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Filter properties
  searchKeyword: string = '';
  selectedStatus: VerificationStatus | null = null;
  dateRange: Date[] | null = null;
  statusOptions: { label: string; value: VerificationStatus | null }[] = [];

  // Dialog properties
  viewDialogVisible: boolean = false;
  reviewDialogVisible: boolean = false;
  selectedVerification: UserVerification | null = null;
  selectedVerificationDetails: UserVerificationDetails | null = null;
  reviewForm!: FormGroup;
  pageReportTemplate: string = '';

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private currentRequest?: any;

  // Expose enum for template
  VerificationStatus = VerificationStatus;

  private readonly statusOptionConfigs = [
    { labelKey: 'verifications.filters.status.all', value: null },
    { labelKey: 'verifications.filters.status.pending', value: VerificationStatus.Pending },
    { labelKey: 'verifications.filters.status.underReview', value: VerificationStatus.UnderReview },
    { labelKey: 'verifications.filters.status.approved', value: VerificationStatus.Approved },
    { labelKey: 'verifications.filters.status.rejected', value: VerificationStatus.Rejected },
    { labelKey: 'verifications.filters.status.requiresUpdate', value: VerificationStatus.RequiresUpdate },
  ];

  constructor(
    private verificationsService: UserVerificationsService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private languageService: LanguageService
  ) {
    this.setupSearchDebounce();
    this.buildStatusOptions();
    this.initReviewForm();
    this.pageReportTemplate = this.t('table.currentPageReport');
    this.observeLanguageChanges();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.buildStatusOptions();
        this.pageReportTemplate = this.t('table.currentPageReport');
        this.cdr.markForCheck();
      });
  }

  private buildStatusOptions(): void {
    this.statusOptions = this.statusOptionConfigs.map((option) => ({
      label: this.t(option.labelKey),
      value: option.value,
    }));
  }

  private initReviewForm(): void {
    this.reviewForm = this.fb.group({
      status: [null, Validators.required],
      rejectionReason: [''],
      adminNotes: ['']
    });

    // Watch status changes to update validators
    this.reviewForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        const rejectionReasonControl = this.reviewForm.get('rejectionReason');
        const adminNotesControl = this.reviewForm.get('adminNotes');

        // Require notes for Rejected and UnderReview statuses
        if (status === VerificationStatus.Rejected || status === VerificationStatus.UnderReview || status === VerificationStatus.RequiresUpdate) {
          rejectionReasonControl?.setValidators([Validators.required]);
          adminNotesControl?.setValidators([Validators.required]);
        } else {
          rejectionReasonControl?.clearValidators();
          adminNotesControl?.clearValidators();
        }

        rejectionReasonControl?.updateValueAndValidity();
        adminNotesControl?.updateValueAndValidity();
      });
  }

  ngOnInit(): void {
    this.loadVerifications();
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
        const trimmedTerm = searchTerm.trim();

        // If search is empty, load immediately without debounce
        if (!trimmedTerm) {
          this.searchKeyword = '';
          this.first = 0;
          this.currentPage = 1;
          this.loadVerifications();
          return;
        }

        // For non-empty search, use minimal debounce
        this.searchKeyword = trimmedTerm;
        this.first = 0;
        this.currentPage = 1;

        setTimeout(() => {
          if (this.searchKeyword === trimmedTerm) {
            this.loadVerifications();
          }
        }, 300);
      });
  }


  /**
   * Load verifications with pagination and filters
   */
  loadVerifications(): void {
    // Cancel previous request if still pending
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }

    this.loading = true;

    const request: VerificationsListRequest = {
      pageSize: this.rows,
      currentPage: this.currentPage,
      searchTerm: this.searchKeyword?.trim() || undefined,
      status: this.selectedStatus ?? undefined,
    };

    // Add date range if selected
    if (this.dateRange && this.dateRange.length === 2) {
      request.fromDate = this.dateRange[0].toISOString();
      request.toDate = this.dateRange[1].toISOString();
    }

    this.currentRequest = this.verificationsService
      .getVerificationsList(request)
      .pipe(
        timeout(30000),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: VerificationsListResponse) => {
          try {
            this.verifications = response.data || [];
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
          this.verifications = [];
          this.totalRecords = 0;
          this.currentRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('verifications.notification.loadError'),
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
    this.searchSubject.next(searchTerm);
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.first = 0;
    this.currentPage = 1;
    this.loadVerifications();
  }

  /**
   * Handle date range change (only apply filter when both dates selected)
   */
  onDateRangeChange(_event?: any): void {
    if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
      this.first = 0;
      this.currentPage = 1;
      this.loadVerifications();
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

    this.loadVerifications();
  }

  /**
   * Show view dialog with verification details
   */
  showViewDialog(verification: UserVerification): void {
    this.selectedVerification = verification;
    this.selectedVerificationDetails = null; // Clear previous data
    this.viewDialogVisible = true;
    this.loading = true;
    
    this.verificationsService
      .getVerificationDetails(verification.id, verification.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.found) {
            this.selectedVerificationDetails = response.details;
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.loading = false;
          this.viewDialogVisible = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('verifications.notification.detailsError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Show review dialog
   */
  showReviewDialog(verification: UserVerification): void {
    this.selectedVerification = verification;
    this.reviewForm.reset();
    this.reviewDialogVisible = true;
  }

  /**
   * Confirm and approve verification
   */
  confirmApprove(event: Event, verification: UserVerification): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t('verifications.confirm.approve', { name: verification.userName }),
      icon: 'pi pi-check-circle',
      rejectButtonProps: {
        label: this.t('theme.button.cancel'),
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: this.t('verifications.button.approve'),
        severity: 'success'
      },
      accept: () => {
        this.approveVerification(verification);
      }
    });
  }

  /**
   * Approve verification directly
   */
  private approveVerification(verification: UserVerification): void {
    const request: ReviewVerificationRequest = {
      verificationId: verification.id,
      status: VerificationStatus.Approved
    };

    this.loading = true;
    this.verificationsService
      .reviewVerification(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('verifications.notification.reviewSuccess'),
            life: 3000,
          });
          this.loadVerifications();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('verifications.notification.reviewError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Submit review form
   */
  submitReview(): void {
    if (this.reviewForm.invalid || !this.selectedVerification) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const formValue = this.reviewForm.value;
    const request: ReviewVerificationRequest = {
      verificationId: this.selectedVerification.id,
      status: formValue.status,
      rejectionReason: formValue.rejectionReason || undefined,
      adminNotes: formValue.adminNotes || undefined
    };

    this.loading = true;
    this.verificationsService
      .reviewVerification(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.reviewDialogVisible = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('verifications.notification.reviewSuccess'),
            life: 3000,
          });
          this.loadVerifications();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('verifications.notification.reviewError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Close view dialog
   */
  closeViewDialog(): void {
    this.viewDialogVisible = false;
    this.selectedVerification = null;
    this.selectedVerificationDetails = null;
  }

  /**
   * Close review dialog
   */
  closeReviewDialog(): void {
    this.reviewDialogVisible = false;
    this.reviewForm.reset();
    this.selectedVerification = null;
  }

  /**
   * Get status severity for PrimeNG tags
   */
  getStatusSeverity(status: string): 'secondary' | 'info' | 'success' | 'danger' | 'warn' | 'contrast' {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warn';
      case 'underreview':
      case 'under review':
        return 'info';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'requiresupdate':
      case 'requires update':
        return 'contrast';
      default:
        return 'secondary';
    }
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}
