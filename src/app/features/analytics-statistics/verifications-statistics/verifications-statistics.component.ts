import { 
  ChangeDetectionStrategy, 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectorRef 
} from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { LanguageService } from '../../../shared/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { VerificationsStatisticsService } from '../services/verifications-statistics.service';
import { VerificationsStatistics } from '../models/verifications-statistics.models';
@Component({
  selector: 'app-verifications-statistics',
    imports: [
    CardModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule,
    CommonModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './verifications-statistics.component.html',
  styleUrl: './verifications-statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerificationsStatisticsComponent implements OnInit, OnDestroy {
  // Data properties
  statistics: VerificationsStatistics | null = null;
  loading: boolean = false;

  private destroy$ = new Subject<void>();

  loadingMessage: string = '';

  constructor(
    private verificationsService: VerificationsStatisticsService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private languageService: LanguageService
  ) {
    this.loadingMessage = this.t('analytics.verifications.loading');
    this.observeLanguageChanges();
  }

  ngOnInit(): void {
    this.loadVerificationsData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadingMessage = this.t('analytics.verifications.loading');
        this.cdr.markForCheck();
      });
  }


  /**
   * Load verifications statistics
   */
  loadVerificationsData(): void {
    this.loading = true;
    
    this.verificationsService.getVerificationsStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: VerificationsStatistics) => {
          this.statistics = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('analytics.verifications.emptyDescription'),
            life: 5000
          });
          this.cdr.detectChanges();
        }
      });
  }



  /**
   * Get total verifications count
   */
  getTotalVerifications(): number {
    if (!this.statistics) return 0;
    return this.statistics.totalPending + this.statistics.totalUnderReview + 
           this.statistics.totalApproved + this.statistics.totalRejected + 
           this.statistics.totalRequiresUpdate;
  }

  /**
   * Get status percentage
   */
  getStatusPercentage(status: 'pending' | 'underReview' | 'approved' | 'rejected' | 'requiresUpdate'): number {
    const totalVerifications = this.getTotalVerifications();
    if (!this.statistics || totalVerifications === 0) return 0;
    
    const statusValue = {
      pending: this.statistics.totalPending,
      underReview: this.statistics.totalUnderReview,
      approved: this.statistics.totalApproved,
      rejected: this.statistics.totalRejected,
      requiresUpdate: this.statistics.totalRequiresUpdate
    }[status];
    
    return Math.round((statusValue / totalVerifications) * 100);
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }

}
