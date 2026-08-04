import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CategoriesService } from '../services/categories.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import {
  Category,
  CreateCategoryRequest,
  EditCategoryRequest,
  CategoriesListRequest,
  CategoriesListResponse
} from '../models/category.models';
import { distinctUntilChanged, Subject, takeUntil, timeout } from 'rxjs';

@Component({
  selector: 'app-categories',
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    InputIconModule,
    IconFieldModule,
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
    TranslatePipe
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent implements OnInit, OnDestroy {
  // Data properties
  categories: Category[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Search properties
  searchKeyword: string = '';
  private searchSubject = new Subject<string>();
  private currentSearchRequest?: any;

  // Dialog properties
  visible: boolean = false;
  isEditMode: boolean = false;
  dialogTitle: string = '';
  pageReportTemplate: string = '';

  // Form properties
  categoryForm!: FormGroup;
  submitted: boolean = false;

  // Validation patterns
  private readonly arabicPattern = /^(?!\s+$)(?!\d+$)(?![^\w\s؀-ۿ]+$)(?=.*[؀-ۿ])[؀-ۿ0-9][؀-ۿ0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  private readonly englishPattern = /^(?!\s+$)(?!\d+$)(?![^\w\s]+$)(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;

  private destroy$ = new Subject<void>();

  constructor(
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {
    this.initializeForm();
    this.setupSearchDebounce();
    this.pageReportTemplate = this.t('table.currentPageReport');
    this.dialogTitle = this.t('categories.dialog.createTitle');
    this.observeLanguageChanges();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageReportTemplate = this.t('table.currentPageReport');
        this.dialogTitle = this.isEditMode
          ? this.t('categories.dialog.editTitle')
          : this.t('categories.dialog.createTitle');
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    this.loadCategories();
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
    this.categoryForm = this.fb.group({
      id: [0],
      nameAr: ['', [Validators.required, Validators.pattern(this.arabicPattern)]],
      nameEn: ['', [Validators.required, Validators.pattern(this.englishPattern)]]
    });
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        const trimmedTerm = searchTerm.trim();

        // If search is empty, load immediately without debounce
        if (!trimmedTerm) {
          this.searchKeyword = '';
          this.first = 0;
          this.currentPage = 1;
          this.loadCategories();
          return;
        }

        // For non-empty search, use minimal debounce
        this.searchKeyword = trimmedTerm;
        this.first = 0;
        this.currentPage = 1;

        // Use setTimeout for very short debounce only for typed searches
        setTimeout(() => {
          if (this.searchKeyword === trimmedTerm) {
            this.loadCategories();
          }
        }, 150); // Much faster debounce for typing
      });
  }

  /**
   * Load categories with pagination and search
   */
  loadCategories(): void {
    // Cancel previous request if still pending
    if (this.currentSearchRequest) {
      this.currentSearchRequest.unsubscribe();
    }

    this.loading = true;

    const request: CategoriesListRequest = {
      searchKeyword: this.searchKeyword,
      pageSize: this.rows,
      currentPage: this.currentPage
    };

    this.currentSearchRequest = this.categoriesService.getCategoriesList(request)
      .pipe(
        timeout(30000), // 30 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: CategoriesListResponse) => {
          try {
            this.categories = response.data || [];
            this.totalRecords = response.totalRecords || 0;
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
          this.categories = [];
          this.totalRecords = 0;
          this.currentSearchRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('categories.notification.loadError'),
            life: 5000
          });
          this.cdr.detectChanges();
        }
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

    this.loadCategories();
  }

  /**
   * Show create dialog
   */
  showCreateDialog(): void {
    this.isEditMode = false;
    this.dialogTitle = this.t('categories.dialog.createTitle');
    this.categoryForm.reset({ id: 0 });
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Show edit dialog
   */
  showEditDialog(category: Category): void {
    this.isEditMode = true;
    this.dialogTitle = this.t('categories.dialog.editTitle');
    this.categoryForm.patchValue(category);
    this.categoryForm.markAsPristine();
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Whether the dialog's save button should be disabled
   */
  isSaveDisabled(): boolean {
    if (this.categoryForm.invalid) return true;
    if (this.isEditMode && this.categoryForm.pristine) return true;
    return false;
  }

  /**
   * Save category (create or edit)
   */
  saveCategory(): void {
    this.submitted = true;

    if (this.categoryForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.categoryForm.value;

    if (this.isEditMode) {
      const editRequest: EditCategoryRequest = {
        id: formValue.id,
        nameAr: formValue.nameAr.trim(),
        nameEn: formValue.nameEn.trim()
      };

      this.categoriesService.editCategory(editRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('categories.notification.updateSuccess'),
              life: 3000
            });
            this.loadCategories();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('categories.notification.updateError'),
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    } else {
      const createRequest: CreateCategoryRequest = {
        nameAr: formValue.nameAr.trim(),
        nameEn: formValue.nameEn.trim()
      };

      this.categoriesService.createCategory(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('categories.notification.createSuccess'),
              life: 3000
            });
            this.loadCategories();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('categories.notification.createError'),
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    }
  }

  /**
   * Confirm and delete category
   */
  confirmDelete(event: Event, category: Category): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t('categories.confirm.deleteMessage', { nameEn: category.nameEn, nameAr: category.nameAr }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('categories.button.cancel'),
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: this.t('categories.button.delete'),
        severity: 'danger'
      },
      accept: () => {
        this.deleteCategory(category.id);
      }
    });
  }

  /**
   * Delete category
   */
  private deleteCategory(categoryId: number): void {
    this.loading = true;

    this.categoriesService.deleteCategory(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('categories.notification.deleteSuccess'),
            life: 3000
          });
          this.loadCategories();
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('categories.notification.deleteError'),
            life: 5000
          });
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Cancel dialog
   */
  cancelDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.categoryForm.reset({ id: 0 });
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      const control = this.categoryForm.get(key);
      control?.markAsTouched();
    });
    this.cdr.detectChanges();
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.categoryForm.get(controlName);
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string, errorType?: string): boolean {
    const control = this.getFormControl(controlName);
    if (!control) return false;

    const hasError = errorType ?
      control.hasError(errorType) :
      control.invalid;

    return hasError && (control.touched || this.submitted);
  }

  /**
   * Get error message for form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.getFormControl(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return controlName === 'nameAr'
        ? this.t('categories.validation.nameArRequired')
        : this.t('categories.validation.nameEnRequired');
    }

    if (control.errors['pattern']) {
      if (controlName === 'nameAr') {
        return this.t('categories.validation.nameArPattern');
      } else {
        return this.t('categories.validation.nameEnPattern');
      }
    }

    return this.t('categories.validation.invalid');
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
