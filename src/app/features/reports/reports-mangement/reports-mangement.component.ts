import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatePicker } from 'primeng/datepicker';
import { Checkbox } from 'primeng/checkbox';
import { ReportsService } from '../services/reports.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import {
  Report,
  ReportsListRequest,
  ReportsListResponse,
  ReportStatusEnum,
  ReportTypeEnum,
  ReportReason,
  ChangeStatusRequest,
  BulkChangeStatusRequest,
  StatusFilterOption,
  TypeFilterOption
} from '../models/reports.models';
import { Subject, takeUntil, timeout, distinctUntilChanged, debounceTime } from 'rxjs';
import { Divider } from "primeng/divider";
@Component({
  selector: 'app-reports-mangement',
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    TagModule,
    Select,
    InputIcon,
    IconField,
    InputTextModule,
    TextareaModule,
    MessageModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    ConfirmPopupModule,
    DatePicker,
    Checkbox,
    Divider
],
  providers: [MessageService, ConfirmationService],
  templateUrl: './reports-mangement.component.html',
  styleUrl: './reports-mangement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsMangementComponent implements OnInit, OnDestroy {
  // Data properties
  reports: Report[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Filter properties
  searchKeyword: string = '';
  selectedReportType: ReportTypeEnum | null = null;
  selectedStatus: ReportStatusEnum | null = null;
  selectedReportReasonId: number | null = null;
  rangeDates: Date[] | null = null;
  reportReasons: ReportReason[] = [];
  
  // Filter options
  typeFilterOptions: TypeFilterOption[] = [
    { label: 'All Types', value: null },
    { label: 'Offer', value: ReportTypeEnum.Offer },
    { label: 'Order', value: ReportTypeEnum.Order },
    { label: 'Chat', value: ReportTypeEnum.Chat }
  ];

  statusFilterOptions: StatusFilterOption[] = [
    { label: 'All Status', value: null },
    { label: 'Pending', value: ReportStatusEnum.Pending },
    { label: 'Under Review', value: ReportStatusEnum.UnderReview },
    { label: 'Resolved', value: ReportStatusEnum.Resolved },
    { label: 'Rejected', value: ReportStatusEnum.Rejected },
    { label: 'Dismissed', value: ReportStatusEnum.Dismissed }
  ];

  // Dialog properties
  viewDialogVisible: boolean = false;
  statusDialogVisible: boolean = false;
  selectedReport: Report | null = null;
  selectedReports: Report[] = [];
  selectAll: boolean = false;

  // Status change form
  statusForm: FormGroup;
  submitted: boolean = false;

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private currentRequest?: any;

  // Expose enums for template
  ReportStatusEnum = ReportStatusEnum;
  ReportTypeEnum = ReportTypeEnum;

  constructor(
    private reportsService: ReportsService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.statusForm = this.fb.group({
      status: [null, Validators.required],
      adminNotes: ['', Validators.required],
      actionTaken: ['', Validators.required]
    });
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
    this.loadReportReasons();
    this.loadReports();
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

  /**
   * Setup search debounce
   */
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        console.log('Search debounce triggered:', searchTerm);
        const trimmedTerm = searchTerm.trim();

        // If search is empty, load immediately without debounce
        if (!trimmedTerm) {
          console.log('Empty search, loading all reports');
          this.searchKeyword = '';
          this.first = 0;
          this.currentPage = 1;
          this.loadReports();
          return;
        }

        // For non-empty search, use minimal debounce
        console.log('Non-empty search, setting keyword:', trimmedTerm);
        this.searchKeyword = trimmedTerm;
        this.first = 0;
        this.currentPage = 1;

        setTimeout(() => {
          if (this.searchKeyword === trimmedTerm) {
            console.log('Executing search after timeout:', this.searchKeyword);
            this.loadReports();
          }
        }, 300);
      });
  }

  /**
   * Load report reasons for filter dropdown
   */
  loadReportReasons(): void {
    this.reportsService
      .getReportReasons()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reasons) => {
          this.reportReasons = reasons || [];
          console.log('Report reasons loaded:', this.reportReasons.length, this.reportReasons);
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Failed to load report reasons:', error);
        },
      });
  }

  /**
   * Load reports with pagination and filters
   */
  loadReports(): void {
    // Cancel previous request if still pending
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }

    this.loading = true;

    const request: ReportsListRequest = {
      pageSize: this.rows,
      currentPage: this.currentPage,
      searchKeyword: this.searchKeyword?.trim() || undefined,
      reportType: this.selectedReportType ?? undefined,
      status: this.selectedStatus ?? undefined,
      reportReasonId: this.selectedReportReasonId ?? undefined,
      fromDate: this.rangeDates?.[0]?.toISOString() || undefined,
      toDate: this.rangeDates?.[1]?.toISOString() || undefined,
    };

    console.log('Loading reports with filters:', request);

    this.currentRequest = this.reportsService
      .getReportsList(request)
      .pipe(
        timeout(30000),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: ReportsListResponse) => {
          try {
            this.reports = response.data || [];
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
        error: (error: any) => {
          console.error('API Error:', error);
          this.loading = false;
          this.reports = [];
          this.totalRecords = 0;
          this.currentRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to load reports',
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
    console.log('Search input:', searchTerm);
    this.searchSubject.next(searchTerm);
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.first = 0;
    this.currentPage = 1;
    this.loadReports();
  }

  /**
   * Handle date range changes - only filter when both dates are selected
   */
  onDateRangeChange(event: any): void {
    // Only trigger filter when both start and end dates are selected
    if (this.rangeDates && this.rangeDates.length === 2 && this.rangeDates[0] && this.rangeDates[1]) {
      this.onFilterChange();
    }
  }

  /**
   * Handle pagination change
   */
  pageChange(event: any): void {
    if (this.loading) {
      return;
    }

    this.first = event.first || 0;
    this.rows = event.rows || 10;
    this.currentPage = Math.floor(this.first / this.rows) + 1;

    this.loadReports();
  }

  /**
   * Handle select all checkbox change
   */
  onSelectAllChange(event: any): void {
    if (event.checked) {
      this.selectedReports = [...this.reports];
    } else {
      this.selectedReports = [];
    }
  }

  /**
   * Show view dialog with report details
   */
  showViewDialog(report: Report): void {
    this.selectedReport = null; // Clear previous data
    this.viewDialogVisible = true;
    this.loading = true;
    
    this.reportsService
      .getReportById(report.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedReport: Report) => {
          console.log('Report details loaded:', detailedReport);
          this.selectedReport = detailedReport;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.loading = false;
          this.viewDialogVisible = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to load report details',
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Show status change dialog
   */
  showStatusDialog(report?: Report): void {
    this.selectedReport = report || null;
    this.statusDialogVisible = true;
    this.statusForm.reset();
  }

  /**
   * Handle bulk status change
   */
  showBulkStatusDialog(): void {
    if (this.selectedReports.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select at least one report',
        life: 3000,
      });
      return;
    }
    this.showStatusDialog();
  }

  /**
   * Submit status change
   */
  submitStatusChange(): void {
    this.submitted = true;
    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    const formValue = this.statusForm.value;
    
    if (this.selectedReport) {
      // Single report status change
      const request: ChangeStatusRequest = {
        reportId: this.selectedReport.id,
        status: formValue.status,
        adminNotes: formValue.adminNotes,
        actionTaken: formValue.actionTaken
      };

      this.reportsService
        .changeReportStatus(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Report status updated successfully',
              life: 3000,
            });
            this.statusDialogVisible = false;
            this.loadReports();
          },
          error: (error: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Failed to update report status',
              life: 5000,
            });
          },
        });
    } else if (this.selectedReports.length > 0) {
      // Bulk status change
      const request: BulkChangeStatusRequest = {
        reportIds: this.selectedReports.map(r => r.id),
        status: formValue.status,
        adminNotes: formValue.adminNotes,
        actionTaken: formValue.actionTaken
      };

      this.reportsService
        .bulkChangeReportStatus(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `${this.selectedReports.length} reports updated successfully`,
              life: 3000,
            });
            this.statusDialogVisible = false;
            this.selectedReports = [];
            this.loadReports();
          },
          error: (error: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Failed to update reports status',
              life: 5000,
            });
          },
        });
    }
  }

  /**
   * Confirm delete report
   */
  confirmDelete(event: Event, report: Report): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Are you sure you want to delete this report?`,
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
        this.deleteReport(report);
      }
    });
  }

  /**
   * Delete report
   */
  private deleteReport(report: Report): void {
    this.reportsService
      .deleteReport(report.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Report deleted successfully',
            life: 3000,
          });
          this.loadReports();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete report',
            life: 5000,
          });
        },
      });
  }

  /**
   * Get status severity for tags
   */
  getStatusSeverity(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warn';
      case 'under review':
        return 'info';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'dismissed':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  /**
   * Get type display name
   */
  getTypeDisplayName(reportType: string): string {
    switch (reportType.toLowerCase()) {
      case 'offer':
        return 'Offer';
      case 'order':
        return 'Order';
      case 'chat':
        return 'Chat';
      default:
        return reportType;
    }
  }

  /**
   * Get type severity for tags
   */
  getTypeSeverity(reportType: string): string {
    switch (reportType.toLowerCase()) {
      case 'offer':
        return 'success';
      case 'order':
        return 'info';
      case 'chat':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  /**
   * Truncate text for display
   */
  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Close view dialog
   */
  closeViewDialog(): void {
    this.viewDialogVisible = false;
    this.selectedReport = null;
  }

  /**
   * Close status dialog
   */
  closeStatusDialog(): void {
    this.statusDialogVisible = false;
    this.selectedReport = null;
    this.statusForm.reset();
    this.submitted = false;
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string): boolean {
    const field = this.statusForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  /**
   * Get error message for form field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.statusForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
    }
    return '';
  }
}

