import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { LanguageService } from '../../../shared/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { VerificationsStatisticsService } from '../services/verifications-statistics.service';
import {
  VerificationsStatistics,
  DateRangeFilter,
} from '../models/verifications-statistics.models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { SelectModule } from 'primeng/select';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-verifications-statistics',
  imports: [
    CardModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule,
    SelectModule,
    CommonModule,
    FormsModule,
    TranslatePipe,
  ],
  providers: [MessageService],
  templateUrl: './verifications-statistics.component.html',
  styleUrl: './verifications-statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationsStatisticsComponent implements OnInit, OnDestroy, AfterViewInit {
  // Chart canvas references
  @ViewChild('submissionsChart') submissionsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('approvalChart') approvalChartRef!: ElementRef<HTMLCanvasElement>;

  // Data properties
  statistics: VerificationsStatistics | null = null;
  loading: boolean = false;

  // Filter properties
  selectedFilter: DateRangeFilter = DateRangeFilter.Last7Days;
  filterOptions: Array<{ label: string; value: DateRangeFilter }> = [];

  // Chart instances
  private submissionsChart: Chart | null = null;
  private statusChart: Chart | null = null;
  private approvalChart: Chart | null = null;

  private destroy$ = new Subject<void>();

  loadingMessage: string = '';

  constructor(
    private verificationsService: VerificationsStatisticsService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private languageService: LanguageService
  ) {
    this.loadingMessage = this.t('analytics.verifications.loading');
    this.updateFilterOptions();
    this.observeLanguageChanges();
  }

  ngOnInit(): void {
    this.loadVerificationsData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadingMessage = this.t('analytics.verifications.loading');
      this.updateFilterOptions();
      this.updateCharts();
      this.cdr.markForCheck();
    });
  }

  private updateFilterOptions(): void {
    this.filterOptions = [
      {
        label: this.t('analytics.verifications.filter.last7Days'),
        value: DateRangeFilter.Last7Days,
      },
      {
        label: this.t('analytics.verifications.filter.last30Days'),
        value: DateRangeFilter.Last30Days,
      },
      {
        label: this.t('analytics.verifications.filter.last90Days'),
        value: DateRangeFilter.Last90Days,
      },
      { label: this.t('analytics.verifications.filter.thisYear'), value: DateRangeFilter.ThisYear },
    ];
  }

  /**
   * Load verifications statistics
   */
  loadVerificationsData(): void {
    this.loading = true;

    this.verificationsService
      .getVerificationsStatistics(this.selectedFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: VerificationsStatistics) => {
          this.statistics = data;
          this.loading = false;
          this.cdr.detectChanges();

          // Initialize or update charts after data is loaded
          setTimeout(() => this.initializeCharts(), 100);
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('analytics.verifications.emptyDescription'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Handle filter change
   */
  onFilterChange(): void {
    this.loadVerificationsData();
  }

  /**
   * Initialize all charts
   */
  private initializeCharts(): void {
    if (!this.statistics) return;

    this.initializeSubmissionsChart();
    this.initializeStatusDistributionChart();
    this.initializeApprovalTrendChart();
  }

  /**
   * Update all charts
   */
  private updateCharts(): void {
    if (!this.statistics) return;

    if (this.submissionsChart) {
      this.submissionsChart.data.labels = this.statistics.submissionsOverTime.map((d) => d.label);
      this.submissionsChart.data.datasets[0].data = this.statistics.submissionsOverTime.map(
        (d) => d.value
      );
      this.submissionsChart.update();
    }

    if (this.statusChart) {
      this.statusChart.data.labels = this.statistics.statusDistribution.map((d) => d.label);
      this.statusChart.data.datasets[0].data = this.statistics.statusDistribution.map(
        (d) => d.value
      );
      this.statusChart.update();
    }

    if (this.approvalChart) {
      this.approvalChart.data.labels = this.statistics.approvalTrend.map((d) => d.label);
      this.approvalChart.data.datasets[0].data = this.statistics.approvalTrend.map((d) => d.value);
      this.approvalChart.update();
    }
  }

  /**
   * Initialize Submissions Over Time Chart
   */
  private initializeSubmissionsChart(): void {
    if (!this.submissionsChartRef || !this.statistics) return;

    const ctx = this.submissionsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.submissionsChart) {
      this.submissionsChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.statistics.submissionsOverTime.map((d) => d.label),
        datasets: [
          {
            label: this.t('analytics.verifications.charts.submissionsOverTime'),
            data: this.statistics.submissionsOverTime.map((d) => d.value),
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: '#3B82F6',
            tension: 0.4,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    };

    this.submissionsChart = new Chart(ctx, config);
  }

  /**
   * Initialize Status Distribution Chart
   */
  private initializeStatusDistributionChart(): void {
    if (!this.statusChartRef || !this.statistics) return;

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.statusChart) {
      this.statusChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: this.statistics.statusDistribution.map((d) => d.label),
        datasets: [
          {
            data: this.statistics.statusDistribution.map((d) => d.value),
            backgroundColor: [
              '#FBBF24', // Pending (yellow)
              '#3B82F6', // Under Review (blue)
              '#10B981', // Approved (green)
              '#EF4444', // Rejected (red)
              '#F59E0B', // Requires Update (orange)
            ],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
            },
          },
        },
      },
    } as ChartConfiguration<'doughnut'>;

    // Apply cutout after configuration
    if (config.options) {
      (config.options as any).cutout = '70%';
    }

    this.statusChart = new Chart(ctx, config);
  }

  /**
   * Initialize Approval Trend Chart
   */
  private initializeApprovalTrendChart(): void {
    if (!this.approvalChartRef || !this.statistics) return;

    const ctx = this.approvalChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.approvalChart) {
      this.approvalChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.statistics.approvalTrend.map((d) => d.label),
        datasets: [
          {
            label: this.t('analytics.verifications.charts.approvalTrend'),
            data: this.statistics.approvalTrend.map((d) => d.value),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    };

    this.approvalChart = new Chart(ctx, config);
  }

  /**
   * Destroy all charts
   */
  private destroyCharts(): void {
    if (this.submissionsChart) {
      this.submissionsChart.destroy();
      this.submissionsChart = null;
    }
    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = null;
    }
    if (this.approvalChart) {
      this.approvalChart.destroy();
      this.approvalChart = null;
    }
  }

  /**
   * Get total verifications count
   */
  getTotalVerifications(): number {
    return this.statistics?.totalSubmissions || 0;
  }

  /**
   * Get status percentage
   */
  getStatusPercentage(
    status: 'pending' | 'underReview' | 'approved' | 'rejected' | 'requiresUpdate'
  ): number {
    const totalVerifications = this.getTotalVerifications();
    if (!this.statistics || totalVerifications === 0) return 0;

    const statusValue = {
      pending: this.statistics.totalPending,
      underReview: this.statistics.totalUnderReview,
      approved: this.statistics.totalApproved,
      rejected: this.statistics.totalRejected,
      requiresUpdate: this.statistics.totalRequiresUpdate,
    }[status];

    return Math.round((statusValue / totalVerifications) * 100);
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }
}
