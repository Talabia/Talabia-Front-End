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
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { CustomerSupportService } from '../services/customer-support.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  ContactUs,
  ContactUsListRequest,
  ContactUsListResponse,
} from '../models/customer-support.models';
import { Subject, takeUntil, timeout } from 'rxjs';
@Component({
  selector: 'app-customer-support-mangement',
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ConfirmPopupModule,
    ProgressSpinnerModule,
    TagModule,
    CommonModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './customer-support-mangement.component.html',
  styleUrl: './customer-support-mangement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerSupportMangementComponent implements OnInit, OnDestroy {
  // Data properties
  contacts: ContactUs[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Dialog properties
  viewDialogVisible: boolean = false;
  selectedContact: ContactUs | null = null;

  private destroy$ = new Subject<void>();
  private currentRequest?: any;

  constructor(
    private customerSupportService: CustomerSupportService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadContacts();
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
   * Load contact us messages with pagination
   */
  loadContacts(): void {
    // Cancel previous request if still pending
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }

    this.loading = true;

    const request: ContactUsListRequest = {
      pageSize: this.rows,
      currentPage: this.currentPage,
    };

    this.currentRequest = this.customerSupportService
      .getContactUsList(request)
      .pipe(
        timeout(30000), // 30 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: ContactUsListResponse) => {
          try {
            this.contacts = response.data || [];
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
          this.contacts = [];
          this.totalRecords = 0;
          this.currentRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to load customer messages',
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

    this.loadContacts();
  }

  /**
   * Show view dialog with contact details
   */
  showViewDialog(contact: ContactUs): void {
    this.loading = true;
    
    this.customerSupportService
      .getContactUsById(contact.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedContact: ContactUs) => {
          this.selectedContact = detailedContact;
          this.viewDialogVisible = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to load contact details',
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Mark contact message as read
   */
  markAsRead(contact: ContactUs): void {
    this.customerSupportService
      .markAsRead({ id: contact.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          contact.isRead = true;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Message marked as read',
            life: 3000,
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to mark message as read',
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Confirm and delete contact message
   */
  confirmDelete(event: Event, contact: ContactUs): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `Are you sure you want to delete this message from "${contact.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: () => {
        this.deleteContact(contact.id);
      },
    });
  }

  /**
   * Delete contact message
   */
  private deleteContact(contactId: string): void {
    this.loading = true;

    this.customerSupportService
      .deleteContactUs(contactId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Message deleted successfully',
            life: 3000,
          });
          this.loadContacts();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to delete message',
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Close view dialog
   */
  closeViewDialog(): void {
    this.viewDialogVisible = false;
    this.selectedContact = null;
  }
}
