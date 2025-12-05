import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { AdvertisementService } from '../services/advertisement.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  Advertisement,
  CreateAdvertisementRequest,
  EditAdvertisementRequest,
  AdvertisementsListRequest,
  AdvertisementsListResponse,
} from '../models/advertisement.models';
import { distinctUntilChanged, Subject, takeUntil, timeout } from 'rxjs';

@Component({
  selector: 'app-advertisement-management',
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    InputIcon,
    IconField,
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
    FileUploadModule,
    ImageModule,
    TagModule,
    Select,
    TranslatePipe,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './advertisement-management.component.html',
  styleUrl: './advertisement-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertisementManagementComponent implements OnInit, OnDestroy {
  // Data properties
  advertisements: Advertisement[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Search and filter properties
  searchKeyword: string = '';
  statusFilter: any = null;
  statusOptions: { label: string; value: boolean | null }[] = [];
  private searchSubject = new Subject<string>();
  private currentSearchRequest?: any;

  // Dialog properties
  visible: boolean = false;
  isEditMode: boolean = false;
  dialogTitle: string = '';

  // Form properties
  advertisementForm!: FormGroup;
  submitted: boolean = false;

  // Image upload properties
  uploadedImageUrl: string = '';
  isImageUploading: boolean = false;

  private destroy$ = new Subject<void>();
  pageReportTemplate: string = '';

  constructor(
    private advertisementService: AdvertisementService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {
    this.initializeForm();
    this.setupSearchDebounce();
    this.buildStatusOptions();
    this.updateDialogTitle();
    this.updatePageReportTemplate();
    this.observeLanguageChanges();
  }

  ngOnInit(): void {
    this.loadAdvertisements();
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

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.buildStatusOptions();
      this.updateDialogTitle();
      this.updatePageReportTemplate();
      this.cdr.markForCheck();
    });
  }

  private buildStatusOptions(): void {
    this.statusOptions = [
      { label: this.t('common.active'), value: true },
      { label: this.t('common.inactive'), value: false },
    ];
  }

  private initializeForm(): void {
    this.advertisementForm = this.fb.group({
      id: [''],
      title: ['', [Validators.required, Validators.minLength(3)]],
      imageUrl: ['', Validators.required],
      isActive: [true, Validators.required],
    });
  }

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
          this.loadAdvertisements();
          return;
        }

        // For non-empty search, use minimal debounce
        this.searchKeyword = trimmedTerm;
        this.first = 0;
        this.currentPage = 1;

        // Use setTimeout for very short debounce only for typed searches
        setTimeout(() => {
          if (this.searchKeyword === trimmedTerm) {
            this.loadAdvertisements();
          }
        }, 150); // Much faster debounce for typing
      });
  }

  /**
   * Load advertisements with pagination, search, and status filter
   */
  loadAdvertisements(): void {
    // Cancel previous request if still pending
    if (this.currentSearchRequest) {
      this.currentSearchRequest.unsubscribe();
    }

    this.loading = true;

    const request: AdvertisementsListRequest = {
      searchKeyword: this.searchKeyword,
      pageSize: this.rows,
      currentPage: this.currentPage,
      isActive: this.statusFilter,
    };

    this.currentSearchRequest = this.advertisementService
      .getAdvertisementsList(request)
      .pipe(
        timeout(30000), // 30 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: AdvertisementsListResponse) => {
          try {
            this.advertisements = response.data || [];
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
        error: (error: any) => {
          console.error('API Error:', error);
          this.loading = false;
          this.advertisements = [];
          this.totalRecords = 0;
          this.currentSearchRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('advertisement.notification.loadError'),
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
   * Handle keyup events for faster response on backspace/delete
   */
  onSearchKeyup(event: any): void {
    const searchTerm = event.target.value || '';
    // For backspace, delete, or when field becomes empty, trigger immediately
    if (event.key === 'Backspace' || event.key === 'Delete' || !searchTerm.trim()) {
      this.searchSubject.next(searchTerm);
    }
  }

  /**
   * Handle status filter change
   */
  onStatusFilterChange(): void {
    this.first = 0;
    this.currentPage = 1;
    this.loadAdvertisements();
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

    this.loadAdvertisements();
  }

  /**
   * Show create dialog
   */
  showCreateDialog(): void {
    this.isEditMode = false;
    this.updateDialogTitle();
    this.advertisementForm.reset({ id: '', isActive: true, imageUrl: '' });
    this.uploadedImageUrl = '';
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Show edit dialog
   */
  showEditDialog(advertisement: Advertisement): void {
    this.isEditMode = true;
    this.updateDialogTitle();
    this.advertisementForm.patchValue(advertisement);
    this.uploadedImageUrl = advertisement.imageUrl || '';
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Handle image upload
   */
  onImageUpload(event: FileSelectEvent): void {
    const file = event.files[0];
    if (!file) return;

    this.isImageUploading = true;

    this.advertisementService
      .uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (imageUrl: string) => {
          this.uploadedImageUrl = imageUrl;
          this.advertisementForm.patchValue({ imageUrl: imageUrl });
          this.isImageUploading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('advertisement.notification.imageUploadSuccess'),
            life: 3000,
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.isImageUploading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('advertisement.notification.imageUploadError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Remove uploaded image
   */
  removeImage(): void {
    this.uploadedImageUrl = '';
    this.advertisementForm.patchValue({ imageUrl: '' });
  }

  /**
   * Save advertisement (create or edit)
   */
  saveAdvertisement(): void {
    this.submitted = true;

    if (this.advertisementForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.advertisementForm.value;

    // Use uploadedImageUrl as fallback if form imageUrl is empty
    const imageUrl = formValue.imageUrl || this.uploadedImageUrl || '';

    if (this.isEditMode) {
      const editRequest: EditAdvertisementRequest = {
        id: formValue.id,
        title: formValue.title.trim(),
        imageUrl: imageUrl,
        isActive: formValue.isActive,
      };

      this.advertisementService
        .editAdvertisement(editRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('advertisement.notification.updateSuccess'),
              life: 3000,
            });
            this.loadAdvertisements();
          },
          error: (error: any) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('advertisement.notification.updateError'),
              life: 5000,
            });
            this.cdr.detectChanges();
          },
        });
    } else {
      const createRequest: CreateAdvertisementRequest = {
        title: formValue.title.trim(),
        imageUrl: imageUrl,
        isActive: formValue.isActive,
      };

      this.advertisementService
        .createAdvertisement(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('advertisement.notification.createSuccess'),
              life: 3000,
            });
            this.loadAdvertisements();
          },
          error: (error: any) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('advertisement.notification.createError'),
              life: 5000,
            });
            this.cdr.detectChanges();
          },
        });
    }
  }

  /**
   * Confirm and delete advertisement
   */
  confirmDelete(event: Event, advertisement: Advertisement): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t('advertisement.confirm.deleteMessage', { title: advertisement.title }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('common.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.t('common.delete'),
        severity: 'danger',
      },
      accept: () => {
        this.deleteAdvertisement(advertisement.id);
      },
    });
  }

  /**
   * Delete advertisement
   */
  private deleteAdvertisement(advertisementId: string): void {
    this.loading = true;

    this.advertisementService
      .deleteAdvertisement(advertisementId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('advertisement.notification.deleteSuccess'),
            life: 3000,
          });
          this.loadAdvertisements();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('advertisement.notification.deleteError'),
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
    this.advertisementForm.reset({ id: '', isActive: true, imageUrl: '' });
    this.uploadedImageUrl = '';
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.advertisementForm.controls).forEach((key) => {
      const control = this.advertisementForm.get(key);
      control?.markAsTouched();
    });
    this.cdr.detectChanges();
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.advertisementForm.get(controlName);
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
      if (controlName === 'title') {
        return this.t('advertisement.validation.titleRequired');
      }
      if (controlName === 'imageUrl') {
        return this.t('advertisement.validation.imageRequired');
      }
      return this.t('common.error');
    }

    if (control.errors['minlength']) {
      return this.t('advertisement.validation.titleMinLength', {
        requiredLength: control.errors['minlength'].requiredLength,
      });
    }

    return this.t('common.error');
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

  private updateDialogTitle(): void {
    this.dialogTitle = this.isEditMode
      ? this.t('advertisement.dialog.editTitle')
      : this.t('advertisement.dialog.createTitle');
  }

  private updatePageReportTemplate(): void {
    this.pageReportTemplate = this.t('table.currentPageReport');
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}
