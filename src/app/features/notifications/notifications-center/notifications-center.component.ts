import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { NotificationsCenterService } from '../services/notifications-center.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import {
  Notification,
  SendNotificationRequest,
  NotificationsListRequest,
  NotificationsListResponse,
  AdminNotificationTargetAudience,
  City,
} from '../models/notifications-center';
import { distinctUntilChanged, Subject, takeUntil, timeout } from 'rxjs';

@Component({
  selector: 'app-notifications-center',
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    DividerModule,
    DialogModule,
    TooltipModule,
    ToastModule,
    ConfirmPopupModule,
    MessageModule,
    ProgressSpinnerModule,
    DatePicker,
    Select,
    TextareaModule,
    TagModule,
    DatePipe,
    TranslatePipe,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './notifications-center.component.html',
  styleUrl: './notifications-center.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsCenterComponent implements OnInit, OnDestroy {
  // Data properties
  notifications: Notification[] = [];
  cities: City[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Filter properties
  rangeDates: Date[] | null = null;
  private currentSearchRequest?: any;

  // Dialog properties
  visible: boolean = false;
  dialogTitle: string = '';

  pageReportTemplate: string = '';

  // Form properties
  notificationForm!: FormGroup;
  submitted: boolean = false;

  // Target audience options
  targetAudienceOptions: { label: string; value: AdminNotificationTargetAudience }[] = [];
  selectedTargetAudience: AdminNotificationTargetAudience | null = null;

  // Expose enum for template
  AdminNotificationTargetAudience = AdminNotificationTargetAudience;

  // Validation patterns
  private readonly arabicPattern =
    /^(?!\s+$)(?!\d+$)(?![^\w\s\u0600-\u06FF]+$)(?=.*[\u0600-\u06FF])[\u0600-\u06FF0-9][\u0600-\u06FF0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  private readonly englishPattern =
    /^(?!\s+$)(?!\d+$)(?![^\w\s]+$)(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;

  private destroy$ = new Subject<void>();

  constructor(
    private notificationsService: NotificationsCenterService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {
    this.initializeForm();
    this.buildTargetAudienceOptions();
    this.pageReportTemplate = this.t('table.currentPageReport');
    this.dialogTitle = this.t('notificationsCenter.dialog.createTitle');
    this.observeLanguageChanges();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.buildTargetAudienceOptions();
      this.pageReportTemplate = this.t('table.currentPageReport');
      this.dialogTitle = this.t('notificationsCenter.dialog.createTitle');
      this.cdr.markForCheck();
    });
  }

  private buildTargetAudienceOptions(): void {
    this.targetAudienceOptions = [
      {
        label: this.t('notificationsCenter.targetAudience.allUsers'),
        value: AdminNotificationTargetAudience.AllUsers,
      },
      {
        label: this.t('notificationsCenter.targetAudience.verifiedAccounts'),
        value: AdminNotificationTargetAudience.VerifiedAccounts,
      },
      {
        label: this.t('notificationsCenter.targetAudience.premiumAccounts'),
        value: AdminNotificationTargetAudience.PremiumAccounts,
      },
      {
        label: this.t('notificationsCenter.targetAudience.specificCity'),
        value: AdminNotificationTargetAudience.SpecificCity,
      },
    ];
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.loadCities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Force stop any pending requests
    if (this.currentSearchRequest) {
      this.currentSearchRequest.unsubscribe();
    }
    this.loading = false;
  }

  private initializeForm(): void {
    this.notificationForm = this.fb.group({
      titleEn: ['', [Validators.required, Validators.minLength(3)]],
      titleAr: ['', [Validators.required, Validators.pattern(this.arabicPattern)]],
      descriptionEn: ['', [Validators.required, Validators.minLength(10)]],
      descriptionAr: ['', [Validators.required, Validators.pattern(this.arabicPattern)]],
      targetAudience: [null, Validators.required],
      cityId: [null],
    });

    // Watch target audience changes to show/hide city field
    this.notificationForm.get('targetAudience')?.valueChanges.subscribe((value) => {
      const cityControl = this.notificationForm.get('cityId');
      if (value === AdminNotificationTargetAudience.SpecificCity) {
        cityControl?.setValidators([Validators.required]);
      } else {
        cityControl?.clearValidators();
        cityControl?.setValue(null);
      }
      cityControl?.updateValueAndValidity();
    });
  }

  /**
   * Load notifications with pagination, search, and date range filter
   */
  loadNotifications(): void {
    // Cancel previous request if still pending
    if (this.currentSearchRequest) {
      this.currentSearchRequest.unsubscribe();
    }

    this.loading = true;

    const request: NotificationsListRequest = {
      pageSize: this.rows,
      currentPage: this.currentPage,
    };

    // Add date range if selected
    if (this.rangeDates && this.rangeDates.length === 2) {
      request.fromDate = this.formatDate(this.rangeDates[0]);
      request.toDate = this.formatDate(this.rangeDates[1]);
    }

    this.currentSearchRequest = this.notificationsService
      .getNotificationsList(request)
      .pipe(
        timeout(30000), // 30 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: NotificationsListResponse) => {
          try {
            this.notifications = response.data || [];
            this.totalRecords = response.totalCount || 0;
            this.loading = false;
            this.currentSearchRequest = undefined;
            this.cdr.detectChanges();
          } catch (error) {
            console.error('Error processing response:', error);
            this.loading = false;
            this.currentSearchRequest = undefined;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('API Error:', error);
          this.loading = false;
          this.notifications = [];
          this.totalRecords = 0;
          this.currentSearchRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('notificationsCenter.notification.loadError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Load cities for dropdown
   */
  loadCities(): void {
    this.notificationsService
      .getCities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities: City[]) => {
          this.cities = cities || [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading cities:', error);
          this.cities = [];
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Handle pagination change
   */
  pageChange(event: any): void {
    // Prevent multiple rapid calls
    if (this.loading) {
      return;
    }

    this.first = event.first || 0;
    this.rows = event.rows || 10;

    // Calculate current page (API expects 1-based page numbers)
    this.currentPage = Math.floor(this.first / this.rows) + 1;

    this.loadNotifications();
  }

  /**
   * Show create notification dialog
   */
  showCreateDialog(): void {
    this.dialogTitle = this.t('notificationsCenter.dialog.createTitle');
    this.notificationForm.reset();
    this.selectedTargetAudience = null;
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Handle date range change - only filter when both dates are selected or when cleared
   */
  onDateRangeChange(): void {
    // Only trigger filter when both start and end dates are selected, or when cleared
    if (
      !this.rangeDates || // Cleared
      (this.rangeDates.length === 2 && this.rangeDates[0] && this.rangeDates[1]) // Both dates selected
    ) {
      this.first = 0;
      this.currentPage = 1;
      this.loadNotifications();
    }
  }

  /**
   * Send notification
   */
  sendNotification(): void {
    this.submitted = true;

    if (this.notificationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.notificationForm.value;

    const sendRequest: SendNotificationRequest = {
      titleEn: formValue.titleEn.trim(),
      titleAr: formValue.titleAr.trim(),
      descriptionEn: formValue.descriptionEn.trim(),
      descriptionAr: formValue.descriptionAr.trim(),
      targetAudience: formValue.targetAudience,
      cityId:
        formValue.targetAudience === AdminNotificationTargetAudience.SpecificCity
          ? formValue.cityId
          : undefined,
    };

    this.notificationsService
      .sendNotification(sendRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.visible = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('notificationsCenter.notification.sendSuccess'),
            life: 3000,
          });
          this.loadNotifications();
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('notificationsCenter.notification.sendError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Cancel dialog
   */
  cancelDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.notificationForm.reset();
    this.selectedTargetAudience = null;
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.notificationForm.controls).forEach((key) => {
      const control = this.notificationForm.get(key);
      control?.markAsTouched();
    });
    this.cdr.detectChanges();
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.notificationForm.get(controlName);
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string, errorType?: string): boolean {
    const control = this.getFormControl(controlName);
    if (!control) return false;

    const hasError = errorType ? control.hasError(errorType) : control.invalid;

    return hasError && (control.touched || this.submitted);
  }

  /**
   * Get error message for form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.getFormControl(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      switch (controlName) {
        case 'titleEn':
          return this.t('notificationsCenter.validation.titleEnRequired');
        case 'titleAr':
          return this.t('notificationsCenter.validation.titleArRequired');
        case 'descriptionEn':
          return this.t('notificationsCenter.validation.descriptionEnRequired');
        case 'descriptionAr':
          return this.t('notificationsCenter.validation.descriptionArRequired');
        case 'targetAudience':
          return this.t('notificationsCenter.validation.targetAudienceRequired');
        case 'cityId':
          return this.t('notificationsCenter.validation.cityRequired');
        default:
          return this.t('common.error');
      }
    }

    if (control.errors['minlength']) {
      if (controlName === 'titleEn') {
        return this.t('notificationsCenter.validation.titleMinLength', {
          requiredLength: control.errors['minlength'].requiredLength,
        });
      }
      if (controlName === 'descriptionEn') {
        return this.t('notificationsCenter.validation.descriptionMinLength', {
          requiredLength: control.errors['minlength'].requiredLength,
        });
      }
    }

    if (control.errors['pattern']) {
      if (controlName === 'titleAr' || controlName === 'descriptionAr') {
        return this.t('notificationsCenter.validation.arabicPattern');
      }
    }

    return this.t('common.error');
  }

  /**
   * Format date for API (using local date to avoid timezone issues)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get target audience display name
   */
  getTargetAudienceDisplayName(targetAudience: string | null): string {
    if (!targetAudience) return this.t('common.none');

    switch (targetAudience) {
      case 'AllUsers':
        return this.t('notificationsCenter.targetAudience.allUsers');
      case 'VerifiedAccounts':
        return this.t('notificationsCenter.targetAudience.verifiedAccounts');
      case 'PremiumAccounts':
        return this.t('notificationsCenter.targetAudience.premiumAccounts');
      case 'SpecificCity':
        return this.t('notificationsCenter.targetAudience.specificCity');
      default:
        return targetAudience;
    }
  }

  /**
   * Get target audience severity for tags
   */
  getTargetAudienceSeverity(targetAudience: string | null): string {
    if (!targetAudience) return 'secondary';

    switch (targetAudience) {
      case 'AllUsers':
        return 'success';
      case 'VerifiedAccounts':
        return 'info';
      case 'PremiumAccounts':
        return 'warn';
      case 'SpecificCity':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Force reset loading state (for debugging)
   */
  resetLoadingState(): void {
    this.loading = false;
    if (this.currentSearchRequest) {
      this.currentSearchRequest.unsubscribe();
      this.currentSearchRequest = undefined;
    }
    this.cdr.detectChanges();
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}
