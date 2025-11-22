import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { TextareaModule } from 'primeng/textarea';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ColorPicker } from 'primeng/colorpicker';
import { LanguageService } from '../../../shared/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ThemeService } from '../services/theme.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { 
  Theme, 
  CreateThemeRequest, 
  EditThemeRequest, 
  ThemesListRequest, 
  ThemesListResponse,
  ThemePalette,
  ThemeDetailsResponse
} from '../models/theme.models';
import { distinctUntilChanged, Subject, takeUntil, timeout } from 'rxjs';
@Component({
  selector: 'app-theme-management',
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
    TagModule,
    ColorPicker,
    TextareaModule,
    TranslatePipe
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './theme management.component.html',
  styleUrl: './theme management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeManagementComponent implements OnInit, OnDestroy {

  // Data properties
  themes: Theme[] = [];
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
  dialogLoading: boolean = false;

  // Form properties
  themeForm!: FormGroup;
  submitted: boolean = false;

  palettePreviewKeys: (keyof ThemePalette)[] = ['primary', 'secondary', 'surface', 'onSurface'];

  paletteFields: { key: keyof ThemePalette; labelKey: string }[] = [
    { key: 'primary', labelKey: 'theme.palette.primary' },
    { key: 'onPrimary', labelKey: 'theme.palette.onPrimary' },
    { key: 'secondary', labelKey: 'theme.palette.secondary' },
    { key: 'onSecondary', labelKey: 'theme.palette.onSecondary' },
    { key: 'onSecondaryContainer', labelKey: 'theme.palette.onSecondaryContainer' },
    { key: 'surface', labelKey: 'theme.palette.surface' },
    { key: 'surfaceContainer', labelKey: 'theme.palette.surfaceContainer' },
    { key: 'surfaceContainerLow', labelKey: 'theme.palette.surfaceContainerLow' },
    { key: 'onSurface', labelKey: 'theme.palette.onSurface' },
    { key: 'onSurfaceVariant', labelKey: 'theme.palette.onSurfaceVariant' },
    { key: 'outline', labelKey: 'theme.palette.outline' },
    { key: 'primaryFixed', labelKey: 'theme.palette.primaryFixed' },
    { key: 'secondaryFixed', labelKey: 'theme.palette.secondaryFixed' },
    { key: 'error', labelKey: 'theme.palette.error' },
    { key: 'onError', labelKey: 'theme.palette.onError' }
  ];

  private readonly defaultLightPalette: ThemePalette = {
    primary: '#1976d2',
    onPrimary: '#ffffff',
    outline: '#8d9199',
    surfaceContainer: '#f5f5f5',
    onSecondary: '#ffffff',
    surface: '#ffffff',
    onSurface: '#1f1f1f',
    onSurfaceVariant: '#45464f',
    surfaceContainerLow: '#f1f1f1',
    secondary: '#424242',
    primaryFixed: '#d0e2ff',
    error: '#b3261e',
    onError: '#ffffff',
    onSecondaryContainer: '#1f1f1f',
    secondaryFixed: '#e3e3e3'
  };

  private readonly defaultDarkPalette: ThemePalette = {
    primary: '#90caf9',
    onPrimary: '#003152',
    outline: '#9199a2',
    surfaceContainer: '#1f1f1f',
    onSecondary: '#1f1f1f',
    surface: '#121212',
    onSurface: '#e0e0e0',
    onSurfaceVariant: '#c4c6cf',
    surfaceContainerLow: '#171717',
    secondary: '#b0bec5',
    primaryFixed: '#003152',
    error: '#f2b8b5',
    onError: '#601410',
    onSecondaryContainer: '#f4f4f4',
    secondaryFixed: '#2c2c2c'
  };

  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService, 
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService, 
    private messageService: MessageService,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {
    this.initializeForm();
    this.setupSearchDebounce();
    this.updateDialogTitle();
    this.pageReportTemplate = this.languageService.translate('table.currentPageReport');
    this.observeLanguageChanges();
  }

  ngOnInit(): void {
    this.loadThemes();
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
    this.languageService.languageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDialogTitle();
        this.pageReportTemplate = this.languageService.translate('table.currentPageReport');
        this.cdr.markForCheck();
      });
  }

  private initializeForm(): void {
    this.themeForm = this.fb.group({
      id: [0],
      nameEn: ['', [Validators.required, Validators.minLength(3)]],
      nameAr: ['', [Validators.required, Validators.minLength(3)]],
      descriptionEn: ['', [Validators.required, Validators.minLength(5)]],
      descriptionAr: ['', [Validators.required, Validators.minLength(5)]],
      light: this.createPaletteGroup(this.defaultLightPalette),
      dark: this.createPaletteGroup(this.defaultDarkPalette)
    });
  }

  private createPaletteGroup(defaults: ThemePalette): FormGroup {
    const group: Record<string, any> = {};
    this.paletteFields.forEach(field => {
      group[field.key] = [defaults[field.key], Validators.required];
    });
    return this.fb.group(group);
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
          this.loadThemes();
          return;
        }
        
        // For non-empty search, use minimal debounce
        this.searchKeyword = trimmedTerm;
        this.first = 0;
        this.currentPage = 1;
        
        // Use setTimeout for very short debounce only for typed searches
        setTimeout(() => {
          if (this.searchKeyword === trimmedTerm) {
            this.loadThemes();
          }
        }, 150); // Much faster debounce for typing
      });
  }

  /**
   * Load themes with pagination, search, and status filter
   */
  loadThemes(): void {
    // Cancel previous request if still pending
    if (this.currentSearchRequest) {
      this.currentSearchRequest.unsubscribe();
    }
    
    this.loading = true;
    
    const request: ThemesListRequest = {
      searchKeyword: this.searchKeyword,
      pageSize: this.rows,
      currentPage: this.currentPage
    };

    this.currentSearchRequest = this.themeService.getThemesList(request)
      .pipe(
        timeout(30000), // 30 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: ThemesListResponse) => {
          try {
            this.themes = response.data || [];
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
          this.themes = [];
          this.totalRecords = 0;
          this.currentSearchRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('theme.notification.loadError'),
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
    
    this.loadThemes();
  }

  /**
   * Show create dialog
   */
  showCreateDialog(): void {
    this.isEditMode = false;
    this.updateDialogTitle();
    this.themeForm.reset({ 
      id: 0, 
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      light: this.defaultLightPalette,
      dark: this.defaultDarkPalette
    });
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Show edit dialog
   */
  showEditDialog(theme: Theme): void {
    this.isEditMode = true;
    this.updateDialogTitle();
    this.dialogLoading = true;
    this.themeService.getThemeById(theme.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details: ThemeDetailsResponse) => {
          this.themeForm.patchValue({
            id: details.id,
            nameEn: details.nameEn,
            nameAr: details.nameAr,
            descriptionEn: details.descriptionEn,
            descriptionAr: details.descriptionAr,
            light: details.lightTheme,
            dark: details.darkTheme
          });
          this.dialogLoading = false;
          this.submitted = false;
          this.visible = true;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.dialogLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('theme.notification.loadError'),
            life: 5000
          });
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Save theme (create or edit)
   */
  saveTheme(): void {
    this.submitted = true;
    
    if (this.themeForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.themeForm.value;

    if (this.isEditMode) {
      const editRequest: EditThemeRequest = {
        id: formValue.id,
        nameEn: formValue.nameEn.trim(),
        nameAr: formValue.nameAr.trim(),
        descriptionEn: formValue.descriptionEn.trim(),
        descriptionAr: formValue.descriptionAr.trim(),
        light: formValue.light,
        dark: formValue.dark
      };

      this.themeService.editTheme(editRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({       
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('theme.notification.updateSuccess'),
              life: 3000
            });
            this.loadThemes();
          },
          error: (error: any) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('theme.notification.updateError'),
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    } else {
      const createRequest: CreateThemeRequest = {
        nameEn: formValue.nameEn.trim(),
        nameAr: formValue.nameAr.trim(),
        descriptionEn: formValue.descriptionEn.trim(),
        descriptionAr: formValue.descriptionAr.trim(),
        light: formValue.light,
        dark: formValue.dark
      };

      this.themeService.createTheme(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('theme.notification.createSuccess'),
              life: 3000
            });
            this.loadThemes();
          },
          error: (error: any) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('theme.notification.createError'),
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    }
  }

  /**
   * Toggle theme active status
   */
  toggleActiveStatus(theme: Theme, event: any): void {
    const newStatus = event.checked;
    
    this.themeService.setActiveStatus({ id: theme.id, status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          theme.isActive = newStatus;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: newStatus
              ? this.t('theme.notification.activateSuccess')
              : this.t('theme.notification.deactivateSuccess'),
            life: 3000
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || (newStatus
              ? this.t('theme.notification.activateError')
              : this.t('theme.notification.deactivateError')),
            life: 5000
          });
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Set theme as default
   */
  setAsDefault(theme: Theme): void {
    this.themeService.setDefaultTheme({ id: theme.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update all themes to mark only this one as default
          this.themes.forEach(t => t.isDefault = t.id === theme.id);
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('theme.notification.setDefaultSuccess'),
            life: 3000
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('theme.notification.setDefaultError'),
            life: 5000
          });
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Confirm and delete theme
   */
  confirmDelete(event: Event, theme: Theme): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t('theme.confirm.deleteMessage', { name: theme.name }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('theme.button.cancel'),
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: this.t('theme.button.delete'),
        severity: 'danger'
      },
      accept: () => {
        this.deleteTheme(theme.id);
      }
    });
  }

  /**
   * Delete theme
   */
  private deleteTheme(themeId: number): void {
    this.loading = true;
    
    this.themeService.deleteTheme(themeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('theme.notification.deleteSuccess'),
            life: 3000
          });
          this.loadThemes();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('theme.notification.deleteError'),
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
    this.themeForm.reset({ 
      id: 0, 
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      light: this.defaultLightPalette,
      dark: this.defaultDarkPalette
    });
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.themeForm.controls).forEach(key => {
      const control = this.themeForm.get(key);
      control?.markAsTouched();
    });
    this.cdr.detectChanges();
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.themeForm.get(controlName);
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
      const fieldNames: { [key: string]: string } = {
        'nameEn': this.t('theme.form.nameEn'),
        'nameAr': this.t('theme.form.nameAr'),
        'descriptionEn': this.t('theme.form.descriptionEn'),
        'descriptionAr': this.t('theme.form.descriptionAr')
      };
      
      if (fieldNames[controlName]) {
        return `${fieldNames[controlName]} ${this.t('theme.validation.required')}`;
      }
      
      // Handle nested palette fields
      if (controlName.includes('.')) {
        return this.t('theme.validation.colorRequired');
      }
      
      return this.t('theme.validation.required');
    }
    
    if (control.errors['minlength']) {
      return this.t('theme.validation.minLength', {
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
      ? this.t('theme.dialog.editTitle')
      : this.t('theme.dialog.createTitle');
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}

