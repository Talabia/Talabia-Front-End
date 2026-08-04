import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DatePicker } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { NotificationsCenterService } from '../services/notifications-center.service';
import { MessageService } from 'primeng/api';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import {
  Notification,
  NotificationsListRequest,
  NotificationsListResponse,
} from '../models/notifications-center';
import { Subject, takeUntil, timeout } from 'rxjs';
import { DateTimePipe } from '../../../shared/pipes/date-time.pipe';

@Component({
  selector: 'app-notifications-center',
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    FormsModule,
    DividerModule,
    TooltipModule,
    ToastModule,
    ProgressSpinnerModule,
    DatePicker,
    TagModule,
    TranslatePipe,
    DateTimePipe
  ],
  providers: [MessageService],
  templateUrl: './notifications-center.component.html',
  styleUrl: './notifications-center.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsCenterComponent implements OnInit, OnDestroy {
  // Data properties
  notifications: Notification[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Filter properties
  rangeDates: Date[] | null = null;
  private currentSearchRequest?: any;

  pageReportTemplate: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private notificationsService: NotificationsCenterService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private languageService: LanguageService,
    private router: Router,
    private navigationService: NavigationService
  ) {
    this.pageReportTemplate = this.t('table.currentPageReport');
    this.observeLanguageChanges();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.pageReportTemplate = this.t('table.currentPageReport');
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.loadNotifications();
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

  /**
   * Load notifications with pagination, search, and date range filter
   */
  loadNotifications(): void {
    // Cancel previous request if still pending
    if (this.currentSearchRequest) {
      this.currentSearchRequest.unsubscribe();
    }

    this.loading = true;

    const request: NotificationsListRequest = {
      pageSize: this.rows,
      currentPage: this.currentPage,
    };

    // Add date range if selected
    if (this.rangeDates && this.rangeDates.length === 2) {
      request.fromDate = this.formatDate(this.rangeDates[0]);
      request.toDate = this.formatDate(this.rangeDates[1]);
    }

    this.currentSearchRequest = this.notificationsService
      .getNotificationsList(request)
      .pipe(
        timeout(30000), // 30 second timeout
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: NotificationsListResponse) => {
          try {
            this.notifications = response.data || [];
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
        error: (error) => {
          console.error('API Error:', error);
          this.loading = false;
          this.notifications = [];
          this.totalRecords = 0;
          this.currentSearchRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('notificationsCenter.notification.loadError'),
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

    this.loadNotifications();
  }

  /**
   * Navigate to send notification page
   */
  navigateToSendNotification(): void {
    const route = this.navigationService.getRouterLink('/notifications/send-notification');
    this.router.navigate([route]);
  }

  /**
   * Handle date range change - only filter when both dates are selected or when cleared
   */
  onDateRangeChange(): void {
    // Only trigger filter when both start and end dates are selected, or when cleared
    if (
      !this.rangeDates || // Cleared
      (this.rangeDates.length === 2 && this.rangeDates[0] && this.rangeDates[1]) // Both dates selected
    ) {
      this.first = 0;
      this.currentPage = 1;
      this.loadNotifications();
    }
  }

  /**
   * Format date for API (using local date to avoid timezone issues)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get target audience display name
   */
  getTargetAudienceDisplayName(targetAudience: string | null): string {
    if (!targetAudience) return this.t('common.none');

    switch (targetAudience) {
      case 'AllUsers':
        return this.t('notificationsCenter.targetAudience.allUsers');
      case 'VerifiedAccounts':
        return this.t('notificationsCenter.targetAudience.verifiedAccounts');
      case 'PremiumAccounts':
        return this.t('notificationsCenter.targetAudience.premiumAccounts');
      case 'SpecificCity':
        return this.t('notificationsCenter.targetAudience.specificCity');
      case 'SpecificUsers':
        return this.t('notificationsCenter.targetAudience.specificUsers');
      default:
        return targetAudience;
    }
  }

  /**
   * Get target audience severity for tags
   */
  getTargetAudienceSeverity(targetAudience: string | null): string {
    if (!targetAudience) return 'secondary';

    switch (targetAudience) {
      case 'AllUsers':
        return 'success';
      case 'VerifiedAccounts':
        return 'info';
      case 'PremiumAccounts':
        return 'warn';
      case 'SpecificCity':
        return 'danger';
      case 'SpecificUsers':
        return 'contrast';
      default:
        return 'secondary';
    }
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
