import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Select } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { NotificationsCenterService } from '../services/notifications-center.service';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import {
  SendNotificationRequest,
  AdminNotificationTargetAudience,
  City,
  AdminUser,
  AdminUsersListRequest,
} from '../models/notifications-center';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Tag } from 'primeng/tag';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

@Component({
  selector: 'app-send-notification',
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    DividerModule,
    TooltipModule,
    ToastModule,
    MessageModule,
    ProgressSpinnerModule,
    Select,
    TextareaModule,
    CheckboxModule,
    TranslatePipe,
    Tag,
    IconField,
    InputIcon,
  ],
  providers: [MessageService],
  templateUrl: './send-notification.component.html',
  styleUrl: './send-notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendNotificationComponent implements OnInit, OnDestroy {
  // Form properties
  notificationForm!: FormGroup;
  submitted: boolean = false;
  loading: boolean = false;

  // Cities for dropdown
  cities: City[] = [];

  // Target audience options
  targetAudienceOptions: { label: string; value: AdminNotificationTargetAudience }[] = [];

  // Expose enum for template
  AdminNotificationTargetAudience = AdminNotificationTargetAudience;

  // Users table properties
  users: AdminUser[] = [];
  selectedUsers: AdminUser[] = [];
  usersLoading: boolean = false;
  usersTotalRecords: number = 0;
  usersFirst: number = 0;
  usersRows: number = 10;
  usersCurrentPage: number = 1;
  usersSearchKeyword: string = '';
  selectAllUsers: boolean = false;

  // Validation patterns
  private readonly arabicPattern =
    /^(?!\s+$)(?!\d+$)(?![^\w\s\u0600-\u06FF]+$)(?=.*[\u0600-\u06FF])[\u0600-\u06FF0-9][\u0600-\u06FF0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  private readonly englishPattern =
    /^(?!\s+$)(?!\d+$)(?![^\w\s]+$)(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private notificationsService: NotificationsCenterService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private fb: FormBuilder,
    private languageService: LanguageService,
    private router: Router,
    private navigationService: NavigationService
  ) {
    this.initializeForm();
    this.buildTargetAudienceOptions();
    this.observeLanguageChanges();
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
    this.loadCities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.buildTargetAudienceOptions();
      this.cdr.markForCheck();
    });
  }

  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.usersFirst = 0;
        this.usersCurrentPage = 1;
        this.loadUsers();
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
      {
        label: this.t('notificationsCenter.targetAudience.specificUsers'),
        value: AdminNotificationTargetAudience.SpecificUsers,
      },
    ];
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

    // Watch target audience changes
    this.notificationForm.get('targetAudience')?.valueChanges.subscribe((value) => {
      const cityControl = this.notificationForm.get('cityId');

      if (value === AdminNotificationTargetAudience.SpecificCity) {
        cityControl?.setValidators([Validators.required]);
      } else {
        cityControl?.clearValidators();
        cityControl?.setValue(null);
      }
      cityControl?.updateValueAndValidity();

      // Load users when Specific Users is selected
      if (value === AdminNotificationTargetAudience.SpecificUsers) {
        this.selectedUsers = [];
        this.selectAllUsers = false;
        this.usersFirst = 0;
        this.usersCurrentPage = 1;
        this.loadUsers();
      } else {
        this.users = [];
        this.selectedUsers = [];
        this.selectAllUsers = false;
      }
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
   * Load users for the table
   */
  loadUsers(): void {
    this.usersLoading = true;
    this.cdr.detectChanges();

    const request: AdminUsersListRequest = {
      pageSize: this.usersRows,
      currentPage: this.usersCurrentPage,
    };

    if (this.usersSearchKeyword && this.usersSearchKeyword.trim()) {
      request.searchKeyword = this.usersSearchKeyword.trim();
    }

    this.notificationsService
      .getAdminUsersList(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.users = response.data || [];
          this.usersTotalRecords = response.totalCount || 0;
          this.usersLoading = false;

          // Update selectAll checkbox state
          this.updateSelectAllState();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.users = [];
          this.usersTotalRecords = 0;
          this.usersLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: this.t('sendNotification.error.loadUsers'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Handle users table pagination
   */
  onUsersPageChange(event: any): void {
    if (this.usersLoading) return;

    this.usersFirst = event.first || 0;
    this.usersRows = event.rows || 10;
    this.usersCurrentPage = Math.floor(this.usersFirst / this.usersRows) + 1;
    this.loadUsers();
  }

  /**
   * Handle search input
   */
  onUsersSearch(event?: any): void {
    const searchTerm = event?.target?.value ?? this.usersSearchKeyword;
    this.usersSearchKeyword = searchTerm;
    this.searchSubject$.next(searchTerm);
  }

  /**
   * Handle select all checkbox change
   */
  onSelectAllChange(event: any): void {
    if (event.checked) {
      // Add all current page users to selection (avoiding duplicates)
      this.users.forEach((user) => {
        if (!this.selectedUsers.find((u) => u.id === user.id)) {
          this.selectedUsers.push(user);
        }
      });
    } else {
      // Remove current page users from selection
      const currentPageUserIds = this.users.map((u) => u.id);
      this.selectedUsers = this.selectedUsers.filter((u) => !currentPageUserIds.includes(u.id));
    }
    this.cdr.detectChanges();
  }

  /**
   * Handle individual row selection change
   */
  onRowSelectionChange(): void {
    this.updateSelectAllState();
    this.cdr.detectChanges();
  }

  /**
   * Update select all checkbox state based on current selection
   */
  private updateSelectAllState(): void {
    if (this.users.length === 0) {
      this.selectAllUsers = false;
      return;
    }

    const currentPageUserIds = this.users.map((u) => u.id);
    const allCurrentPageSelected = currentPageUserIds.every((id) =>
      this.selectedUsers.some((u) => u.id === id)
    );
    this.selectAllUsers = allCurrentPageSelected;
  }

  /**
   * Check if user is selected
   */
  isUserSelected(user: AdminUser): boolean {
    return this.selectedUsers.some((u) => u.id === user.id);
  }

  /**
   * Toggle user selection
   */
  toggleUserSelection(user: AdminUser): void {
    const index = this.selectedUsers.findIndex((u) => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
    this.updateSelectAllState();
    this.cdr.detectChanges();
  }

  /**
   * Check if form and selections are valid for submission
   */
  isFormValid(): boolean {
    if (this.notificationForm.invalid) {
      return false;
    }

    const targetAudience = this.notificationForm.get('targetAudience')?.value;
    if (targetAudience === AdminNotificationTargetAudience.SpecificUsers) {
      return this.selectedUsers.length > 0;
    }

    return true;
  }

  /**
   * Send notification
   */
  sendNotification(): void {
    this.submitted = true;

    if (!this.isFormValid()) {
      this.markFormGroupTouched();
      if (
        this.notificationForm.get('targetAudience')?.value ===
          AdminNotificationTargetAudience.SpecificUsers &&
        this.selectedUsers.length === 0
      ) {
        this.messageService.add({
          severity: 'warn',
          summary: this.t('common.warning'),
          detail: this.t('sendNotification.validation.usersRequired'),
          life: 5000,
        });
      }
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
    };

    // Add cityId if specific city is selected
    if (formValue.targetAudience === AdminNotificationTargetAudience.SpecificCity) {
      sendRequest.cityId = formValue.cityId;
    }

    // Add userIds if specific users is selected
    if (formValue.targetAudience === AdminNotificationTargetAudience.SpecificUsers) {
      sendRequest.userIds = this.selectedUsers.map((u) => u.id);
    }

    this.notificationsService
      .sendNotification(sendRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('notificationsCenter.notification.sendSuccess'),
            life: 3000,
          });
          // Navigate back after success
          setTimeout(() => {
            this.goBack();
          }, 1500);
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
   * Navigate back to notifications center
   */
  goBack(): void {
    const route = this.navigationService.getRouterLink('/notifications/notifications-center');
    this.router.navigate([route]);
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

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}
