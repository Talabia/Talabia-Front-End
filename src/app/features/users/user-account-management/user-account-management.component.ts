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
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsersService } from '../services/users.service';
import { CitiesService } from '../../looksup/services/cities.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import {
  AdminUser,
  AdminUserDetails,
  UsersListRequest,
  UsersListResponse,
  UserTypeFilterEnum,
} from '../models/user.models';
import { City } from '../../looksup/models/city.models';
import { Subject, takeUntil, timeout, distinctUntilChanged } from 'rxjs';
import { Tooltip } from 'primeng/tooltip';
@Component({
  selector: 'app-user-account-management',
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
    FormsModule,
    CommonModule,
    ConfirmPopupModule,
    TranslatePipe,
    Tooltip,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-account-management.component.html',
  styleUrl: './user-account-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAccountManagementComponent implements OnInit, OnDestroy {
  // Data properties
  users: AdminUser[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination properties
  first: number = 0;
  rows: number = 10;
  currentPage: number = 1;

  // Filter properties
  searchKeyword: string = '';
  selectedCityId: number | null = null;
  selectedFilter: UserTypeFilterEnum | null = null;
  cities: City[] = [];
  filterOptions: { label: string; value: UserTypeFilterEnum | null }[] = [];
  cityOptionLabel: keyof City = 'nameEn';

  // Dialog properties
  viewDialogVisible: boolean = false;
  selectedUser: AdminUserDetails | null = null;
  pageReportTemplate: string = '';

  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private currentRequest?: any;

  // Expose enum for template
  UserTypeFilterEnum = UserTypeFilterEnum;

  private readonly filterOptionConfigs = [
    { labelKey: 'users.filters.type.premium', value: UserTypeFilterEnum.Premium },
    { labelKey: 'users.filters.type.banned', value: UserTypeFilterEnum.Banned },
  ];

  constructor(
    private usersService: UsersService,
    private citiesService: CitiesService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private languageService: LanguageService
  ) {
    this.setupSearchDebounce();
    this.buildFilterOptions();
    this.pageReportTemplate = this.t('table.currentPageReport');
    this.updateCityOptionLabel();
    this.observeLanguageChanges();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.buildFilterOptions();
      this.pageReportTemplate = this.t('table.currentPageReport');
      this.updateCityOptionLabel();
      this.cdr.markForCheck();
    });
  }

  private buildFilterOptions(): void {
    this.filterOptions = this.filterOptionConfigs.map((option) => ({
      label: this.t(option.labelKey),
      value: option.value,
    }));
  }

  private updateCityOptionLabel(): void {
    const currentLang = this.languageService.getCurrentLanguage();
    this.cityOptionLabel = currentLang === 'ar' ? 'nameAr' : 'nameEn';
  }

  ngOnInit(): void {
    this.loadCities();
    this.loadUsers();
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
        const trimmedTerm = searchTerm.trim();

        // If search is empty, load immediately without debounce
        if (!trimmedTerm) {
          this.searchKeyword = '';
          this.first = 0;
          this.currentPage = 1;
          this.loadUsers();
          return;
        }

        // For non-empty search, use minimal debounce
        this.searchKeyword = trimmedTerm;
        this.first = 0;
        this.currentPage = 1;

        setTimeout(() => {
          if (this.searchKeyword === trimmedTerm) {
            this.loadUsers();
          }
        }, 300);
      });
  }

  /**
   * Load cities for filter dropdown
   */
  loadCities(): void {
    this.citiesService
      .getCitiesList({ pageSize: 100, currentPage: 1 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cities = response.data || [];
          console.log('Cities loaded:', this.cities.length, this.cities);
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Failed to load cities:', error);
        },
      });
  }

  /**
   * Load users with pagination and filters
   */
  loadUsers(): void {
    // Cancel previous request if still pending
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }

    this.loading = true;

    const request: UsersListRequest = {
      pageSize: this.rows,
      currentPage: this.currentPage,
      searchKeyword: this.searchKeyword?.trim() || undefined,
      cityId: this.selectedCityId ?? undefined,
      filter: this.selectedFilter ?? undefined,
    };

    console.log('Loading users with filters:', {
      cityId: this.selectedCityId,
      filter: this.selectedFilter,
      searchKeyword: this.searchKeyword,
      request,
    });

    this.currentRequest = this.usersService
      .getUsersList(request)
      .pipe(timeout(30000), takeUntil(this.destroy$))
      .subscribe({
        next: (response: UsersListResponse) => {
          try {
            this.users = response.data || [];
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
          this.users = [];
          this.totalRecords = 0;
          this.currentRequest = undefined;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('users.notification.loadError'),
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
    this.searchSubject.next(searchTerm);
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.first = 0;
    this.currentPage = 1;
    this.loadUsers();
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

    this.loadUsers();
  }

  /**
   * Show view dialog with user details
   */
  showViewDialog(user: AdminUser): void {
    this.selectedUser = null; // Clear previous data
    this.viewDialogVisible = true;
    this.loading = true;

    this.usersService
      .getUserDetails(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedUser: AdminUserDetails) => {
          console.log('User details loaded:', detailedUser);
          this.selectedUser = detailedUser;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.loading = false;
          this.viewDialogVisible = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('users.notification.detailsError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Confirm and toggle ban status
   */
  confirmBanToggle(event: Event, user: AdminUser): void {
    const action = user.isBlocked ? 'users.confirm.unban' : 'users.confirm.ban';
    const acceptLabel = user.isBlocked ? 'users.button.unban' : 'users.button.ban';

    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t(action, { name: user.userName }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('theme.button.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.t(acceptLabel),
        severity: user.isBlocked ? 'success' : 'danger',
      },
      accept: () => {
        this.toggleBanStatus(user);
      },
    });
  }

  /**
   * Toggle ban status
   */
  private toggleBanStatus(user: AdminUser): void {
    const newStatus = !user.isBlocked;

    this.usersService
      .banUser({ userId: user.id, block: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          user.isBlocked = newStatus;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('users.notification.banSuccess'),
            life: 3000,
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('users.notification.banError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Confirm and toggle premium status
   */
  confirmPremiumToggle(event: Event, user: AdminUser): void {
    const action = user.isPremium ? 'users.confirm.removePremium' : 'users.confirm.makePremium';
    const acceptLabel = user.isPremium ? 'users.button.makeRegular' : 'users.button.makePremium';

    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: this.t(action, { name: user.userName }),
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: this.t('theme.button.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.t(acceptLabel),
        severity: user.isPremium ? 'secondary' : 'primary',
      },
      accept: () => {
        this.togglePremiumStatus(user);
      },
    });
  }

  /**
   * Toggle premium status
   */
  private togglePremiumStatus(user: AdminUser): void {
    const newStatus = !user.isPremium;

    this.usersService
      .setPremiumStatus({ userId: user.id, isPremium: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          user.isPremium = newStatus;
          this.messageService.add({
            severity: 'success',
            summary: this.t('common.success'),
            detail: this.t('users.notification.premiumSuccess'),
            life: 3000,
          });
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('users.notification.premiumError'),
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
    this.selectedUser = null;
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}
