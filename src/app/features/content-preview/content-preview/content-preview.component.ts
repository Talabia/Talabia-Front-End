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
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { MessageModule } from 'primeng/message';
import { Select } from 'primeng/select';
import { EditorModule } from 'primeng/editor';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { ContentService } from '../services/content.service';
import {
  AdminContent,
  CreateAdminContentRequest,
  EditAdminContentRequest,
  AdminContentListRequest,
  AdminContentListResponse,
  ContentType,
  AdminContentDetailsResponse
} from '../models/content.models';
import { Subject, takeUntil, timeout } from 'rxjs';

@Component({
  selector: 'app-content-preview',
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    ReactiveFormsModule,
    DividerModule,
    DialogModule,
    TooltipModule,
    ToastModule,
    ConfirmPopupModule,
    MessageModule,
    Select,
    EditorModule,
    InputTextModule,
    TranslatePipe,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './content-preview.component.html',
  styleUrl: './content-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPreviewComponent implements OnInit, OnDestroy {
  // Data properties
  contents: AdminContent[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Dialog properties
  createEditDialogVisible: boolean = false;
  previewDialogVisible: boolean = false;
  isEditMode: boolean = false;
  dialogTitle: string = '';
  pageReportTemplate: string = '';

  // Preview content
  previewContent: AdminContentDetailsResponse | null = null;

  // Form properties
  contentForm!: FormGroup;
  submitted: boolean = false;

  // Type filter options
  contentTypeOptions: { label: string; value: ContentType }[] = [];

  // Expose enum for template
  ContentType = ContentType;

  // Validation patterns
  private readonly arabicPattern =
    /^(?!\s+$)(?!\d+$)(?![^\w\s\u0600-\u06FF]+$)(?=.*[\u0600-\u06FF])[\u0600-\u06FF0-9][\u0600-\u06FF0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  private readonly englishPattern =
    /^(?!\s+$)(?!\d+$)(?![^\w\s]+$)(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;

  private destroy$ = new Subject<void>();
  private currentRequest?: any;

  private readonly typeOptionConfigs = [
    { labelKey: 'contentPreview.type.usagePolicy', value: ContentType.UsagePolicy },
    { labelKey: 'contentPreview.type.aboutUs', value: ContentType.AboutUs },
  ];

  constructor(
    private contentService: ContentService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {
    this.initializeForm();
    this.buildTypeOptions();
    this.pageReportTemplate = this.t('table.currentPageReport');
    this.dialogTitle = this.t('contentPreview.dialog.createTitle');
    this.observeLanguageChanges();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.buildTypeOptions();
      this.pageReportTemplate = this.t('table.currentPageReport');
      this.dialogTitle = this.isEditMode
        ? this.t('contentPreview.dialog.editTitle')
        : this.t('contentPreview.dialog.createTitle');
      this.cdr.markForCheck();
    });
  }

  private buildTypeOptions(): void {
    this.contentTypeOptions = this.typeOptionConfigs.map((option) => ({
      label: this.t(option.labelKey),
      value: option.value,
    }));
  }

  ngOnInit(): void {
    this.loadContents();
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

  private initializeForm(): void {
    this.contentForm = this.fb.group({
      id: [0],
      type: [null, Validators.required],
      titleAr: ['', [Validators.required, Validators.pattern(this.arabicPattern)]],
      titleEn: ['', [Validators.required, Validators.pattern(this.englishPattern)]],
      contentAr: ['', Validators.required],
      contentEn: ['', Validators.required],
    });
  }

  /**
   * Load contents with pagination
   */
  loadContents(): void {
    // Cancel previous request if still pending
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }

    this.loading = true;

    const request: AdminContentListRequest = {
      pageSize: this.rows,
      currentPage: this.currentPage,
    };

    this.currentRequest = this.contentService
      .getAdminContentList(request)
      .pipe(timeout(30000), takeUntil(this.destroy$))
      .subscribe({
        next: (response: AdminContentListResponse) => {
          try {
            this.contents = response.data || [];
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
        error: (error) => {
          console.error('API Error:', error);
          this.loading = false;
          this.contents = [];
          this.totalRecords = 0;
          this.currentRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('contentPreview.notification.loadError'),
            life: 5000,
          });
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

    this.loadContents();
  }

  /**
   * Show create dialog
   */
  showCreateDialog(): void {
    this.isEditMode = false;
    this.dialogTitle = this.t('contentPreview.dialog.createTitle');
    this.contentForm.reset({ id: 0, type: null });
    this.submitted = false;
    this.createEditDialogVisible = true;
  }

  /**
   * Show edit dialog
   */
  showEditDialog(content: AdminContent): void {
    this.loading = true;

    this.contentService
      .getAdminContentById(content.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedContent: AdminContent) => {
          this.isEditMode = true;
          this.dialogTitle = this.t('contentPreview.dialog.editTitle');
          this.contentForm.patchValue(detailedContent);
          this.submitted = false;
          this.createEditDialogVisible = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('contentPreview.notification.loadError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Show preview dialog
   */
  showPreviewDialog(content: AdminContent): void {
    this.loading = true;
    this.previewContent = null;

    this.contentService
      .getAdminContentDetails(content.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailsResponse: AdminContentDetailsResponse) => {
          this.previewContent = detailsResponse;
          this.previewDialogVisible = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('contentPreview.notification.previewError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Save content (create or edit)
   */
  saveContent(): void {
    this.submitted = true;

    if (this.contentForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.contentForm.value;

    if (this.isEditMode) {
      const editRequest: EditAdminContentRequest = {
        id: formValue.id,
        type: formValue.type,
        titleAr: formValue.titleAr.trim(),
        titleEn: formValue.titleEn.trim(),
        contentAr: formValue.contentAr,
        contentEn: formValue.contentEn,
      };

      this.contentService
        .editAdminContent(editRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.createEditDialogVisible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('contentPreview.notification.updateSuccess'),
              life: 3000,
            });
            this.loadContents();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('contentPreview.notification.updateError'),
              life: 5000,
            });
            this.cdr.detectChanges();
          },
        });
    } else {
      const createRequest: CreateAdminContentRequest = {
        type: formValue.type,
        titleAr: formValue.titleAr.trim(),
        titleEn: formValue.titleEn.trim(),
        contentAr: formValue.contentAr,
        contentEn: formValue.contentEn,
      };

      this.contentService
        .createAdminContent(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.createEditDialogVisible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('contentPreview.notification.createSuccess'),
              life: 3000,
            });
            this.loadContents();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('contentPreview.notification.createError'),
              life: 5000,
            });
            this.cdr.detectChanges();
          },
        });
    }
  }

  /**
   * Confirm and delete content
   */
  confirmDelete(event: Event, content: AdminContent): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t('contentPreview.confirm.deleteMessage', {
        title: content.title,
      }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('contentPreview.button.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.t('contentPreview.button.delete'),
        severity: 'danger',
      },
      accept: () => {
        this.deleteContent(content.id);
      },
    });
  }

  /**
   * Delete content
   */
  private deleteContent(contentId: number): void {
    this.loading = true;

    this.contentService
      .deleteAdminContent(contentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('contentPreview.notification.deleteSuccess'),
            life: 3000,
          });
          this.loadContents();
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('contentPreview.notification.deleteError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Cancel create/edit dialog
   */
  cancelDialog(): void {
    this.createEditDialogVisible = false;
    this.submitted = false;
    this.contentForm.reset({ id: 0, type: null });
  }

  /**
   * Close preview dialog
   */
  closePreviewDialog(): void {
    this.previewDialogVisible = false;
    this.previewContent = null;
  }

  /**
   * Get content type label
   */
  getContentTypeLabel(type: ContentType): string {
    switch (type) {
      case ContentType.UsagePolicy:
        return this.t('contentPreview.type.usagePolicy');
      case ContentType.AboutUs:
        return this.t('contentPreview.type.aboutUs');
      default:
        return '';
    }
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.contentForm.controls).forEach((key) => {
      const control = this.contentForm.get(key);
      control?.markAsTouched();
    });
    this.cdr.detectChanges();
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.contentForm.get(controlName);
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
      return this.t(`contentPreview.validation.${controlName}Required`);
    }

    if (control.errors['pattern']) {
      return this.t(`contentPreview.validation.${controlName}Pattern`);
    }

    return this.t('contentPreview.validation.invalid');
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}
