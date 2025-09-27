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
import { CitiesService } from '../services/cities.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { 
  City, 
  CreateCityRequest, 
  EditCityRequest, 
  CitiesListRequest, 
  CitiesListResponse 
} from '../models/city.models';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cities',
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
    ProgressSpinnerModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './cities.component.html',
  styleUrl: './cities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitiesComponent implements OnInit, OnDestroy {
  // Data properties
  cities: City[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  
  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;
  
  // Search properties
  searchKeyword: string = '';
  private searchSubject = new Subject<string>();
  
  // Dialog properties
  visible: boolean = false;
  isEditMode: boolean = false;
  dialogTitle: string = 'Create City';
  
  // Form properties
  cityForm!: FormGroup;
  submitted: boolean = false;
  
  // Validation patterns
  private readonly arabicPattern = /^(?!\s+$)(?!\d+$)(?![^\w\s\u0600-\u06FF]+$)(?=.*[\u0600-\u06FF])[\u0600-\u06FF0-9][\u0600-\u06FF0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  private readonly englishPattern = /^(?!\s+$)(?!\d+$)(?![^\w\s]+$)(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9\s.,!?@#$%^&()|_+=<>:;\-\[\]]*$/;
  
  private destroy$ = new Subject<void>();

  constructor(
    private citiesService: CitiesService, 
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService, 
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
    this.loadCities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.cityForm = this.fb.group({
      id: [0],
      nameAr: ['', [Validators.required, Validators.pattern(this.arabicPattern)]],
      nameEn: ['', [Validators.required, Validators.pattern(this.englishPattern)]]
    });
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchKeyword = searchTerm;
        this.first = 0;
        this.currentPage = 1;
        this.loadCities();
      });
  }

  /**
   * Load cities with pagination and search
   */
  loadCities(): void {
    this.loading = true;
    
    const request: CitiesListRequest = {
      searchKeyword: this.searchKeyword,
      pageSize: this.rows,
      currentPage: this.currentPage
    };

    console.log('Loading cities with request:', request);
    
    this.citiesService.getCitiesList(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: CitiesListResponse) => {
          console.log('Cities API Response:', response);
          this.cities = response.data || [];
          this.totalRecords = response.totalRecords || 0;
          this.loading = false;
          console.log('Cities loaded:', this.cities.length, 'Total records:', this.totalRecords);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Cities API Error:', error);
          this.loading = false;
          
          // For testing purposes, add some mock data if API fails
          this.cities = [
            { id: 1, nameAr: 'الرياض', nameEn: 'Riyadh' },
            { id: 2, nameAr: 'جدة', nameEn: 'Jeddah' },
            { id: 3, nameAr: 'مكة المكرمة', nameEn: 'Mecca' }
          ];
          this.totalRecords = 3;
          console.log('Using mock data due to API error');
          
          this.messageService.add({
            severity: 'warn',
            summary: 'API Error - Using Mock Data',
            detail: error.message || 'Failed to load cities from API, showing test data',
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
    const searchTerm = event.target.value;
    this.searchSubject.next(searchTerm);
  }

  /**
   * Handle pagination change
   */
  pageChange(event: { first: number; rows: number; }): void {
    this.first = event.first;
    this.rows = event.rows;
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.loadCities();
  }

  /**
   * Show create dialog
   */
  showCreateDialog(): void {
    this.isEditMode = false;
    this.dialogTitle = 'Create City';
    this.cityForm.reset({ id: 0 });
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Show edit dialog
   */
  showEditDialog(city: City): void {
    this.isEditMode = true;
    this.dialogTitle = 'Edit City';
    this.cityForm.patchValue(city);
    this.submitted = false;
    this.visible = true;
  }

  /**
   * Save city (create or edit)
   */
  saveCity(): void {
    this.submitted = true;
    
    if (this.cityForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.cityForm.value;

    if (this.isEditMode) {
      const editRequest: EditCityRequest = {
        id: formValue.id,
        nameAr: formValue.nameAr.trim(),
        nameEn: formValue.nameEn.trim()
      };

      this.citiesService.editCity(editRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'City updated successfully',
              life: 3000
            });
            this.loadCities();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Failed to update city',
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    } else {
      const createRequest: CreateCityRequest = {
        nameAr: formValue.nameAr.trim(),
        nameEn: formValue.nameEn.trim()
      };

      this.citiesService.createCity(createRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loading = false;
            this.visible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'City created successfully',
              life: 3000
            });
            this.loadCities();
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Failed to create city',
              life: 5000
            });
            this.cdr.detectChanges();
          }
        });
    }
  }

  /**
   * Confirm and delete city
   */
  confirmDelete(event: Event, city: City): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Are you sure you want to delete "${city.nameEn}" (${city.nameAr})?`,
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
        this.deleteCity(city.id);
      }
    });
  }

  /**
   * Delete city
   */
  private deleteCity(cityId: number): void {
    this.loading = true;
    
    this.citiesService.deleteCity(cityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'City deleted successfully',
            life: 3000
          });
          this.loadCities();
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete city',
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
    this.cityForm.reset({ id: 0 });
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.cityForm.controls).forEach(key => {
      const control = this.cityForm.get(key);
      control?.markAsTouched();
    });
    this.cdr.detectChanges();
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.cityForm.get(controlName);
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
}
