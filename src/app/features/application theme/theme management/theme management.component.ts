import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { TagModule } from 'primeng/tag';
import { ColorPicker } from 'primeng/colorpicker';
import { ThemeService } from '../services/theme.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { 
  Theme, 
  CreateThemeRequest, 
  EditThemeRequest, 
  ThemesListRequest, 
  ThemesListResponse 
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
    ColorPicker
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
  dialogTitle: string = 'Create Theme';
  
  // Form properties
  themeForm!: FormGroup;
  submitted: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService, 
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService, 
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
    this.setupSearchDebounce();
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

  private initializeForm(): void {
    this.themeForm = this.fb.group({
      id: [0],
      name: ['', [Validators.required, Validators.minLength(3)]],
      primaryColor: ['#1976d2', Validators.required],
      secondaryColor: ['#424242', Validators.required],
      backgroundColor: ['#ffffff', Validators.required],
      textColor: ['#000000', Validators.required]
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
            summary: 'Error',
            detail: error.message || 'Failed to load themes',
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
    this.dialogTitle = 'Create Theme';
    this.themeForm.reset({ 
      id: 0, 
      name: '',
      primaryColor: '#1976d2',
      secondaryColor: '#424242',
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Show edit dialog
   */
  showEditDialog(theme: Theme): void {
    this.isEditMode = true;
    this.dialogTitle = 'Edit Theme';
    this.themeForm.patchValue({
      id: theme.id,
      name: theme.name,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor
    });
    this.submitted = false;
    this.visible = true;
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
        name: formValue.name.trim(),
        primaryColor: formValue.primaryColor,
        secondaryColor: formValue.secondaryColor,
        backgroundColor: formValue.backgroundColor,
        textColor: formValue.textColor
      };

      this.themeService.editTheme(editRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({       
              severity: 'success',
              summary: 'Success',
              detail: 'Theme updated successfully',
              life: 3000
            });
            this.loadThemes();
          },
          error: (error: any) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Failed to update theme',
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    } else {
      const createRequest: CreateThemeRequest = {
        name: formValue.name.trim(),
        primaryColor: formValue.primaryColor,
        secondaryColor: formValue.secondaryColor,
        backgroundColor: formValue.backgroundColor,
        textColor: formValue.textColor
      };

      this.themeService.createTheme(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Theme created successfully',
              life: 3000
            });
            this.loadThemes();
          },
          error: (error: any) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Failed to create theme',
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
            summary: 'Success',
            detail: `Theme ${newStatus ? 'activated' : 'deactivated'} successfully`,
            life: 3000
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to update theme status',
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
            summary: 'Success',
            detail: 'Default theme updated successfully',
            life: 3000
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to set default theme',
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
      message: `Are you sure you want to delete "${theme.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: 'Delete',
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
            summary: 'Success',
            detail: 'Theme deleted successfully',
            life: 3000
          });
          this.loadThemes();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete theme',
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
      name: '',
      primaryColor: '#1976d2',
      secondaryColor: '#424242',
      backgroundColor: '#9e9d9dff',
      textColor: '#000000'
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
        'name': 'Theme name',
        'primaryColor': 'Primary color',
        'secondaryColor': 'Secondary color',
        'backgroundColor': 'Background color',
        'textColor': 'Text color'
      };
      return `${fieldNames[controlName] || 'Field'} is required`;
    }
    
    if (control.errors['minlength']) {
      return `Theme name must be at least ${control.errors['minlength'].requiredLength} characters`;
    }

    return 'Invalid input';
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
}

