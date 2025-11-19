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
import { VehicleTypesService } from '../services/vehicle-types.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { 
  VehicleType, 
  CreateVehicleTypeRequest, 
  EditVehicleTypeRequest, 
  VehicleTypesListRequest, 
  VehicleTypesListResponse 
} from '../models/vehicle-types.models';
import { debounceTime, distinctUntilChanged, Subject, takeUntil, timeout } from 'rxjs';

@Component({
  selector: 'app-vehicle-types',
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
  templateUrl: './vehicle-types.component.html',
  styleUrl: './vehicle-types.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleTypesComponent implements OnInit, OnDestroy {
  // Data properties
  vehicleTypes: VehicleType[] = [];
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
  vehicleTypeForm!: FormGroup;
  submitted: boolean = false;
  
  // Validation patterns
  private readonly arabicPattern = /^(?!\s+$)(?!\d+$)(?![^\w\s\u0600-\u06FF]+$)(?=.*[\u0600-\u06FF])[\u0600-\u06FF0-9][\u0600-\u06FF0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  private readonly englishPattern = /^(?!\s+$)(?!\d+$)(?![^\w\s]+$)(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  
  private destroy$ = new Subject<void>();

  constructor(
    private vehicleTypesService: VehicleTypesService, 
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService, 
    private messageService: MessageService,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {
    this.initializeForm();
    this.setupSearchDebounce();
    this.pageReportTemplate = this.t('table.currentPageReport');
    this.dialogTitle = this.t('vehicleTypes.dialog.createTitle');
    this.observeLanguageChanges();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageReportTemplate = this.t('table.currentPageReport');
        this.dialogTitle = this.isEditMode
          ? this.t('vehicleTypes.dialog.editTitle')
          : this.t('vehicleTypes.dialog.createTitle');
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    this.loadVehicleTypes();
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
    this.vehicleTypeForm = this.fb.group({
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
          this.loadVehicleTypes();
          return;
        }
        
        // For non-empty search, use minimal debounce
        this.searchKeyword = trimmedTerm;
        this.first = 0;
        this.currentPage = 1;
        
        // Use setTimeout for very short debounce only for typed searches
        setTimeout(() => {
          if (this.searchKeyword === trimmedTerm) {
            this.loadVehicleTypes();
          }
        }, 150); // Much faster debounce for typing
      });
  }

  /**
   * Load vehicle types with pagination and search
   */
  loadVehicleTypes(): void {
    // Cancel previous request if still pending
    if (this.currentSearchRequest) {
      this.currentSearchRequest.unsubscribe();
    }
    
    this.loading = true;
    
    const request: VehicleTypesListRequest = {
      searchKeyword: this.searchKeyword,
      pageSize: this.rows,
      currentPage: this.currentPage
    };

    this.currentSearchRequest = this.vehicleTypesService.getVehicleTypesList(request)
      .pipe(
        timeout(30000), // 30 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: VehicleTypesListResponse) => {
          try {
            this.vehicleTypes = response.data || [];
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
          this.vehicleTypes = [];
          this.totalRecords = 0;
          this.currentSearchRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('vehicleTypes.notification.loadError'),
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
    
    this.loadVehicleTypes();
  }

  /**
   * Show create dialog
   */
  showCreateDialog(): void {
    this.isEditMode = false;
    this.dialogTitle = this.t('vehicleTypes.dialog.createTitle');
    this.vehicleTypeForm.reset({ id: 0 });
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Show edit dialog
   */
  showEditDialog(vehicleType: VehicleType): void {
    this.isEditMode = true;
    this.dialogTitle = this.t('vehicleTypes.dialog.editTitle');
    this.vehicleTypeForm.patchValue(vehicleType);
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Save vehicle type (create or edit)
   */
  saveVehicleType(): void {
    this.submitted = true;
    
    if (this.vehicleTypeForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.vehicleTypeForm.value;

    if (this.isEditMode) {
      const editRequest: EditVehicleTypeRequest = {
        id: formValue.id,
        nameAr: formValue.nameAr.trim(),
        nameEn: formValue.nameEn.trim()
      };

      this.vehicleTypesService.editVehicleType(editRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('vehicleTypes.notification.updateSuccess'),
              life: 3000
            });
            this.loadVehicleTypes();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('vehicleTypes.notification.updateError'),
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    } else {
      const createRequest: CreateVehicleTypeRequest = {
        nameAr: formValue.nameAr.trim(),
        nameEn: formValue.nameEn.trim()
      };

      this.vehicleTypesService.createVehicleType(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('vehicleTypes.notification.createSuccess'),
              life: 3000
            });
            this.loadVehicleTypes();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('vehicleTypes.notification.createError'),
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    }
  }

  /**
   * Confirm and delete vehicle type
   */
  confirmDelete(event: Event, vehicleType: VehicleType): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t('vehicleTypes.confirm.deleteMessage', { nameEn: vehicleType.nameEn, nameAr: vehicleType.nameAr }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('vehicleTypes.button.cancel'),
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: this.t('vehicleTypes.button.delete'),
        severity: 'danger'
      },
      accept: () => {
        this.deleteVehicleType(vehicleType.id);
      }
    });
  }

  /**
   * Delete vehicle type
   */
  private deleteVehicleType(vehicleTypeId: number): void {
    this.loading = true;
    
    this.vehicleTypesService.deleteVehicleType(vehicleTypeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('vehicleTypes.notification.deleteSuccess'),
            life: 3000
          });
          this.loadVehicleTypes();
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('vehicleTypes.notification.deleteError'),
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
    this.vehicleTypeForm.reset({ id: 0 });
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.vehicleTypeForm.controls).forEach(key => {
      const control = this.vehicleTypeForm.get(key);
      control?.markAsTouched();
    });
    this.cdr.detectChanges();
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.vehicleTypeForm.get(controlName);
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
        ? this.t('vehicleTypes.validation.nameArRequired')
        : this.t('vehicleTypes.validation.nameEnRequired');
    }
    
    if (control.errors['pattern']) {
      if (controlName === 'nameAr') {
        return this.t('vehicleTypes.validation.nameArPattern');
      } else {
        return this.t('vehicleTypes.validation.nameEnPattern');
      }
    }

    return this.t('vehicleTypes.validation.invalid');
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
