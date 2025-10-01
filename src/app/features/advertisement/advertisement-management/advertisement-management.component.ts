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
import { FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { AdvertisementService } from '../services/advertisement.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { 
  Advertisement, 
  CreateAdvertisementRequest, 
  EditAdvertisementRequest, 
  AdvertisementsListRequest, 
  AdvertisementsListResponse 
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
    Select
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
  statusOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];
  private searchSubject = new Subject<string>();
  private currentSearchRequest?: any;
  
  // Dialog properties
  visible: boolean = false;
  isEditMode: boolean = false;
  dialogTitle: string = 'Create Advertisement';
  
  // Form properties
  advertisementForm!: FormGroup;
  submitted: boolean = false;
  
  // Image upload properties
  uploadedImageUrl: string = '';
  isImageUploading: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private advertisementService: AdvertisementService, 
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService, 
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
    this.setupSearchDebounce();
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

  private initializeForm(): void {
    this.advertisementForm = this.fb.group({
      id: [''],
      title: ['', [Validators.required, Validators.minLength(3)]],
      imageUrl: ['', Validators.required],
      isActive: [true, Validators.required]
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
      isActive: this.statusFilter
    };

    this.currentSearchRequest = this.advertisementService.getAdvertisementsList(request)
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
            summary: 'Error',
            detail: error.message || 'Failed to load advertisements',
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
    this.dialogTitle = 'Create Advertisement';
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
    this.dialogTitle = 'Edit Advertisement';
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
    
    this.advertisementService.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (imageUrl: string) => {
          this.uploadedImageUrl = imageUrl;
          this.advertisementForm.patchValue({ imageUrl: imageUrl });
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
        isActive: formValue.isActive
      };

      this.advertisementService.editAdvertisement(editRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Advertisement updated successfully',
              life: 3000
            });
            this.loadAdvertisements();
          },
          error: (error: any) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Failed to update advertisement',
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    } else {
      const createRequest: CreateAdvertisementRequest = {
        title: formValue.title.trim(),
        imageUrl: imageUrl,
        isActive: formValue.isActive
      };

      this.advertisementService.createAdvertisement(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Advertisement created successfully',
              life: 3000
            });
            this.loadAdvertisements();
          },
          error: (error: any) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Failed to create advertisement',
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    }
  }

  /**
   * Confirm and delete advertisement
   */
  confirmDelete(event: Event, advertisement: Advertisement): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Are you sure you want to delete "${advertisement.title}"?`,
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
        this.deleteAdvertisement(advertisement.id);
      }
    });
  }

  /**
   * Delete advertisement
   */
  private deleteAdvertisement(advertisementId: string): void {
    this.loading = true;
    
    this.advertisementService.deleteAdvertisement(advertisementId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Advertisement deleted successfully',
            life: 3000
          });
          this.loadAdvertisements();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete advertisement',
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
    this.advertisementForm.reset({ id: '', isActive: true, imageUrl: '' });
    this.uploadedImageUrl = '';
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.advertisementForm.controls).forEach(key => {
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
      return `${controlName === 'title' ? 'Title' : controlName === 'imageUrl' ? 'Image' : 'Field'} is required`;
    }
    
    if (control.errors['minlength']) {
      return `Title must be at least ${control.errors['minlength'].requiredLength} characters`;
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
