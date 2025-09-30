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
import { FileUpload, FileUploadEvent, FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { VehicleMakersService } from '../services/vehicle-makers.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { 
  VehicleMaker, 
  CreateVehicleMakerRequest, 
  EditVehicleMakerRequest, 
  VehicleMakersListRequest, 
  VehicleMakersListResponse 
} from '../models/vehicle-makers.models';
import { distinctUntilChanged, Subject, takeUntil, timeout } from 'rxjs';
@Component({
  selector: 'app-vehicle-makers',
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
    ImageModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './vehicle-makers.component.html',
  styleUrl: './vehicle-makers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleMakersComponent implements OnInit, OnDestroy {

  // Data properties
  vehicleMakers: VehicleMaker[] = [];
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
  dialogTitle: string = 'Create Vehicle Maker';
  
  // Form properties
  vehicleMakerForm!: FormGroup;
  submitted: boolean = false;
  
  // Image upload properties
  uploadedImageUrl: string = '';
  isImageUploading: boolean = false;
  
  // Validation patterns
  private readonly arabicPattern = /^(?!\s+$)(?!\d+$)(?![^\w\s\u0600-\u06FF]+$)(?=.*[\u0600-\u06FF])[\u0600-\u06FF0-9][\u0600-\u06FF0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  private readonly englishPattern = /^(?!\s+$)(?!\d+$)(?![^\w\s]+$)(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  
  private destroy$ = new Subject<void>();

  constructor(
    private vehicleMakersService: VehicleMakersService, 
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService, 
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
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
    this.vehicleMakerForm = this.fb.group({
      id: [0],
      nameAr: ['', [Validators.required, Validators.pattern(this.arabicPattern)]],
      nameEn: ['', [Validators.required, Validators.pattern(this.englishPattern)]],
      logo: ['']
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
          this.loadVehicleMakers();
          return;
        }
        
        // For non-empty search, use minimal debounce
        this.searchKeyword = trimmedTerm;
        this.first = 0;
        this.currentPage = 1;
        
        // Use setTimeout for very short debounce only for typed searches
        setTimeout(() => {
          if (this.searchKeyword === trimmedTerm) {
            this.loadVehicleMakers();
          }
        }, 150); // Much faster debounce for typing
      });
  }

  /**
   * Load vehicle makers with pagination and search
   */
  loadVehicleMakers(): void {
    // Cancel previous request if still pending
    if (this.currentSearchRequest) {
      this.currentSearchRequest.unsubscribe();
    }
    
    this.loading = true;
    
    const request: VehicleMakersListRequest = {
      searchKeyword: this.searchKeyword,
      pageSize: this.rows,
      currentPage: this.currentPage
    };

    this.currentSearchRequest = this.vehicleMakersService.getVehicleMakersList(request)
      .pipe(
        timeout(30000), // 30 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: VehicleMakersListResponse) => {
          try {
            this.vehicleMakers = response.data || [];
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
        error: (error: any) => {
          console.error('API Error:', error);
          this.loading = false;
          this.vehicleMakers = [];
          this.totalRecords = 0;
          this.currentSearchRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to load vehicle makers',
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
    
    this.loadVehicleMakers();
  }

  /**
   * Show create dialog
   */
  showCreateDialog(): void {
    this.isEditMode = false;
    this.dialogTitle = 'Create Vehicle Maker';
    this.vehicleMakerForm.reset({ id: 0, logo: '' });
    this.uploadedImageUrl = '';
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Show edit dialog
   */
  showEditDialog(vehicleMaker: VehicleMaker): void {
    this.isEditMode = true;
    this.dialogTitle = 'Edit Vehicle Maker';
    this.vehicleMakerForm.patchValue(vehicleMaker);
    this.uploadedImageUrl = vehicleMaker.logo || '';
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
    
    this.vehicleMakersService.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (imageUrl: string) => {
          this.uploadedImageUrl = imageUrl;
          this.vehicleMakerForm.patchValue({ logo: imageUrl });
          this.isImageUploading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Image uploaded successfully',
            life: 3000
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.isImageUploading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to upload image',
            life: 5000
          });
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Remove uploaded image
   */
  removeImage(): void {
    this.uploadedImageUrl = '';
    this.vehicleMakerForm.patchValue({ logo: '' });
  }

  /**
   * Save vehicle maker (create or edit)
   */
  saveVehicleMaker(): void {
    this.submitted = true;
    
    if (this.vehicleMakerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.vehicleMakerForm.value;
    
    // Use uploadedImageUrl as fallback if form logo is empty
    const logoUrl = formValue.logo || this.uploadedImageUrl || '';

    if (this.isEditMode) {
      const editRequest: EditVehicleMakerRequest = {
        id: formValue.id,
        nameAr: formValue.nameAr.trim(),
        nameEn: formValue.nameEn.trim(),
        logo: logoUrl
      };

      this.vehicleMakersService.editVehicleMaker(editRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Vehicle maker updated successfully',
              life: 3000
            });
            this.loadVehicleMakers();
          },
          error: (error: any) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Failed to update vehicle maker',
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    } else {
      const createRequest: CreateVehicleMakerRequest = {
        nameAr: formValue.nameAr.trim(),
        nameEn: formValue.nameEn.trim(),
        logo: logoUrl
      };

      this.vehicleMakersService.createVehicleMaker(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Vehicle maker created successfully',
              life: 3000
            });
            this.loadVehicleMakers();
          },
          error: (error: any) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Failed to create vehicle maker',
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    }
  }

  /**
   * Confirm and delete vehicle maker
   */
  confirmDelete(event: Event, vehicleMaker: VehicleMaker): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Are you sure you want to delete "${vehicleMaker.nameEn}" (${vehicleMaker.nameAr})?`,
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
        this.deleteVehicleMaker(vehicleMaker.id);
      }
    });
  }

  /**
   * Delete vehicle maker
   */
  private deleteVehicleMaker(vehicleMakerId: number): void {
    this.loading = true;
    
    this.vehicleMakersService.deleteVehicleMaker(vehicleMakerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Vehicle maker deleted successfully',
            life: 3000
          });
          this.loadVehicleMakers();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete vehicle maker',
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
    this.vehicleMakerForm.reset({ id: 0, logo: '' });
    this.uploadedImageUrl = '';
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.vehicleMakerForm.controls).forEach(key => {
      const control = this.vehicleMakerForm.get(key);
      control?.markAsTouched();
    });
    this.cdr.detectChanges();
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.vehicleMakerForm.get(controlName);
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
      return `${controlName === 'nameAr' ? 'Arabic name' : 'English name'} is required`;
    }
    
    if (control.errors['pattern']) {
      if (controlName === 'nameAr') {
        return 'Arabic name must contain at least one Arabic character and be properly formatted';
      } else {
        return 'English name must contain at least one English letter and be properly formatted';
      }
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
