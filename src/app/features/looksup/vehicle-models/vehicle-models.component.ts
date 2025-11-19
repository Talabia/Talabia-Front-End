import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { VehicleModelsService } from '../services/vehicle-models.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { 
  VehicleModel, 
  CreateVehicleModelRequest, 
  EditVehicleModelRequest, 
  VehicleModelsListRequest, 
  VehicleModelsListResponse,
  VehicleModelDetailsResponse,
  VehicleMakerLookup
} from '../models/vehicle-models.models';
import { distinctUntilChanged, Subject, takeUntil, timeout } from 'rxjs';

@Component({
  selector: 'app-vehicle-models',
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
    SelectModule,
    TranslatePipe
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './vehicle-models.component.html',
  styleUrl: './vehicle-models.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleModelsComponent implements OnInit, OnDestroy {
  // Data properties
  vehicleModels: VehicleModel[] = [];
  vehicleMakers: VehicleMakerLookup[] = [];
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
  currentVehicleModel?: VehicleModelDetailsResponse;
  
  // Form properties
  vehicleModelForm!: FormGroup;
  submitted: boolean = false;
  
  // Validation patterns
  private readonly arabicPattern = /^(?!\s+$)(?!\d+$)(?![^\w\s\u0600-\u06FF]+$)(?=.*[\u0600-\u06FF])[\u0600-\u06FF0-9][\u0600-\u06FF0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  private readonly englishPattern = /^(?!\s+$)(?!\d+$)(?![^\w\s]+$)(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  
  private destroy$ = new Subject<void>();

  constructor(
    private vehicleModelsService: VehicleModelsService, 
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService, 
    private messageService: MessageService,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {
    this.initializeForm();
    this.setupSearchDebounce();
    this.pageReportTemplate = this.t('table.currentPageReport');
    this.dialogTitle = this.t('vehicleModels.dialog.createTitle');
    this.observeLanguageChanges();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageReportTemplate = this.t('table.currentPageReport');
        this.dialogTitle = this.isEditMode
          ? this.t('vehicleModels.dialog.editTitle')
          : this.t('vehicleModels.dialog.createTitle');
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    this.loadVehicleModels();
    this.loadVehicleMakers();
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
    this.vehicleModelForm = this.fb.group({
      id: [0],
      nameAr: ['', [Validators.required, Validators.pattern(this.arabicPattern)]],
      nameEn: ['', [Validators.required, Validators.pattern(this.englishPattern)]],
      makerId: [null, [Validators.required]]
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
          this.loadVehicleModels();
          return;
        }
        
        // For non-empty search, use minimal debounce
        this.searchKeyword = trimmedTerm;
        this.first = 0;
        this.currentPage = 1;
        
        // Use setTimeout for very short debounce only for typed searches
        setTimeout(() => {
          if (this.searchKeyword === trimmedTerm) {
            this.loadVehicleModels();
          }
        }, 150); // Much faster debounce for typing
      });
  }

  /**
   * Load vehicle models with pagination and search
   */
  loadVehicleModels(): void {
    // Cancel previous request if still pending
    if (this.currentSearchRequest) {
      this.currentSearchRequest.unsubscribe();
    }
    
    this.loading = true;
    
    const request: VehicleModelsListRequest = {
      searchKeyword: this.searchKeyword,
      pageSize: this.rows,
      currentPage: this.currentPage
    };

    this.currentSearchRequest = this.vehicleModelsService.getVehicleModelsList(request)
      .pipe(
        timeout(30000), // 30 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: VehicleModelsListResponse) => {
          try {
            this.vehicleModels = response.data || [];
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
          this.vehicleModels = [];
          this.totalRecords = 0;
          this.currentSearchRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('vehicleModels.notification.loadError'),
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
    
    this.loadVehicleModels();
  }

  /**
   * Load vehicle makers for dropdown
   */
  loadVehicleMakers(): void {
    this.vehicleModelsService.getVehicleMakersLookup()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (makers) => {
          this.vehicleMakers = makers || [];
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load vehicle makers:', error);
          this.vehicleMakers = [];
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('vehicleModels.notification.makersLoadError'),
            life: 5000
          });
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Show create dialog
   */
  showCreateDialog(): void {
    this.isEditMode = false;
    this.dialogTitle = this.t('vehicleModels.dialog.createTitle');
    this.vehicleModelForm.reset({ id: 0, makerId: null });
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Show edit dialog
   */
  showEditDialog(vehicleModel: VehicleModel): void {
    this.isEditMode = true;
    this.dialogTitle = this.t('vehicleModels.dialog.editTitle');
    
    // Load full details for editing
    this.vehicleModelsService.getVehicleModelById(vehicleModel.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.currentVehicleModel = details;
          this.vehicleModelForm.patchValue({
            id: details.id,
            nameAr: details.nameAr,
            nameEn: details.nameEn,
            makerId: details.makerId
          });
          this.submitted = false;
          this.visible = true;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('vehicleModels.notification.detailsError'),
            life: 5000
          });
        }
      });
  }

  /**
   * Save vehicle model (create or edit)
   */
  saveVehicleModel(): void {
    this.submitted = true;
    
    if (this.vehicleModelForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.vehicleModelForm.value;

    if (this.isEditMode) {
      const editRequest: EditVehicleModelRequest = {
        id: formValue.id,
        nameAr: formValue.nameAr.trim(),
        nameEn: formValue.nameEn.trim(),
        makerId: formValue.makerId
      };

      this.vehicleModelsService.editVehicleModel(editRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('vehicleModels.notification.updateSuccess'),
              life: 3000
            });
            this.loadVehicleModels();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('vehicleModels.notification.updateError'),
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    } else {
      const createRequest: CreateVehicleModelRequest = {
        nameAr: formValue.nameAr.trim(),
        nameEn: formValue.nameEn.trim(),
        makerId: formValue.makerId
      };

      this.vehicleModelsService.createVehicleModel(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: this.t('common.success'),
              detail: this.t('vehicleModels.notification.createSuccess'),
              life: 3000
            });
            this.loadVehicleModels();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: this.t('common.error'),
              detail: error.message || this.t('vehicleModels.notification.createError'),
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    }
  }

  /**
   * Confirm and delete vehicle model
   */
  confirmDelete(event: Event, vehicleModel: VehicleModel): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t('vehicleModels.confirm.deleteMessage', { nameEn: vehicleModel.nameEn, nameAr: vehicleModel.nameAr }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('vehicleModels.button.cancel'),
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps: {
        label: this.t('vehicleModels.button.delete'),
        severity: 'danger'
      },
      accept: () => {
        this.deleteVehicleModel(vehicleModel.id);
      }
    });
  }

  /**
   * Delete vehicle model
   */
  private deleteVehicleModel(vehicleModelId: number): void {
    this.loading = true;
    
    this.vehicleModelsService.deleteVehicleModel(vehicleModelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('vehicleModels.notification.deleteSuccess'),
            life: 3000
          });
          this.loadVehicleModels();
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('vehicleModels.notification.deleteError'),
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
    this.vehicleModelForm.reset({ id: 0, makerId: null });
    this.currentVehicleModel = undefined;
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.vehicleModelForm.controls).forEach(key => {
      const control = this.vehicleModelForm.get(key);
      control?.markAsTouched();
    });
    this.cdr.detectChanges();
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.vehicleModelForm.get(controlName);
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
      if (controlName === 'nameAr') return this.t('vehicleModels.validation.nameArRequired');
      if (controlName === 'nameEn') return this.t('vehicleModels.validation.nameEnRequired');
      if (controlName === 'makerId') return this.t('vehicleModels.validation.makerRequired');
      return this.t('form.validation.required');
    }
    
    if (control.errors['pattern']) {
      if (controlName === 'nameAr') {
        return this.t('vehicleModels.validation.nameArPattern');
      } else if (controlName === 'nameEn') {
        return this.t('vehicleModels.validation.nameEnPattern');
      }
    }

    return this.t('vehicleModels.validation.invalid');
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

