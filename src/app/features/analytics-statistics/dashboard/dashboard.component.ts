import { 
  ChangeDetectionStrategy, 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectorRef 
} from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { LanguageService } from '../../../shared/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { DashboardService } from '../services/dashboard.service';
import { 
  DashboardStatistics, 
  DashboardFilterOption, 
  DashboardFilterEnum,
  ChartData,
  ChartOptions
} from '../models/dashboard-statistics.models';

@Component({
  selector: 'app-dashboard',
  imports: [
    CardModule,
    ChartModule,
    ButtonModule,
    Select,
    ToastModule,
    ProgressSpinnerModule,
    TagModule,
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Data properties
  statistics: DashboardStatistics | null = null;
  loading: boolean = false;

  // Filter properties
  selectedFilter: DashboardFilterEnum = DashboardFilterEnum.All;
  filterOptions: DashboardFilterOption[] = [];

  // Chart data
  statusChartData: ChartData | null = null;
  typeChartData: ChartData | null = null;
  reasonChartData: ChartData | null = null;
  timelineChartData: ChartData | null = null;

  // Chart options
  pieChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        display: true,
      }
    }
  };

  barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        display: true
      },
      x: {
        display: true
      }
    },
    elements: {
      bar: {
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: false
      }
    },
    datasets: {
      bar: {
        categoryPercentage: 0.6,
        barPercentage: 0.7
      }
    }
  };

  lineChartOptions!: ChartOptions;

  // Color palettes with gradients and 70% opacity
  private statusColors = [
    'rgba(34, 211, 238, 0.7)',   // Cyan
    'rgba(56, 189, 248, 0.7)',   // Sky Blue
    'rgba(96, 165, 250, 0.7)',   // Blue
    'rgba(129, 140, 248, 0.7)',  // Indigo
    'rgba(45, 212, 191, 0.7)'    // Teal
  ];
  
  private typeColors = [
    'rgba(56, 189, 248, 0.7)',   // Sky Blue
    'rgba(96, 165, 250, 0.7)',   // Blue
    'rgba(129, 140, 248, 0.7)'   // Indigo
  ];
  
  private reasonColors = [
    'rgba(34, 211, 238, 0.7)',   // Cyan
    'rgba(56, 189, 248, 0.7)',   // Sky Blue
    'rgba(96, 165, 250, 0.7)',   // Blue
    'rgba(129, 140, 248, 0.7)',  // Indigo
    'rgba(45, 212, 191, 0.7)'    // Teal
  ];

  private destroy$ = new Subject<void>();

  loadingMessage: string = '';

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private languageService: LanguageService
  ) {
    this.buildFilterOptions();
    this.loadingMessage = this.t('analytics.dashboard.loading');
    this.lineChartOptions = this.buildLineChartOptions();
    this.observeLanguageChanges();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.buildFilterOptions();
        this.loadingMessage = this.t('analytics.dashboard.loading');
        this.lineChartOptions = this.buildLineChartOptions();
        this.prepareChartData();
        this.cdr.markForCheck();
      });
  }

  private buildFilterOptions(): void {
    this.filterOptions = [
      { label: this.t('analytics.dashboard.filter.all'), value: DashboardFilterEnum.All },
      { label: this.t('analytics.dashboard.filter.7'), value: DashboardFilterEnum.Last7Days },
      { label: this.t('analytics.dashboard.filter.30'), value: DashboardFilterEnum.Last30Days },
      { label: this.t('analytics.dashboard.filter.90'), value: DashboardFilterEnum.Last90Days },
      { label: this.t('analytics.dashboard.filter.year'), value: DashboardFilterEnum.ThisYear }
    ];
  }

  /**
   * Load dashboard statistics
   */
  loadDashboardData(): void {
    this.loading = true;
    
    this.dashboardService.getDashboardStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DashboardStatistics) => {
          this.statistics = data;
          this.prepareChartData();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('analytics.dashboard.emptyDescription'),
            life: 5000
          });
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Handle filter change
   */
  onFilterChange(): void {
    // For now, just reload data
    // In a real implementation, you would pass the filter to the API
    this.loadDashboardData();
  }

  /**
   * Prepare chart data from statistics
   */
  private prepareChartData(): void {
    if (!this.statistics) return;

    // Status Chart (Pie Chart)
    this.statusChartData = {
      labels: [
        this.t('analytics.dashboard.pending'),
        this.t('analytics.dashboard.underReview'),
        this.t('analytics.dashboard.resolved'),
        this.t('analytics.dashboard.rejected')
      ],
      datasets: [{
        label: this.t('analytics.dashboard.statusChartTitle'),
        data: [
          this.statistics.pendingReports,
          this.statistics.underReviewReports,
          this.statistics.resolvedReports,
          this.statistics.rejectedReports
        ],
        backgroundColor: this.statusColors.slice(0, 4),
        borderWidth: 2
      }]
    };

    // Type Chart (Doughnut Chart)
    const typeLabels = Object.keys(this.statistics.reportsByType);
    const typeData = Object.values(this.statistics.reportsByType);
    
    this.typeChartData = {
      labels: typeLabels,
      datasets: [{
        label: this.t('analytics.dashboard.typeChartTitle'),
        data: typeData,
        backgroundColor: this.typeColors.slice(0, typeLabels.length),
        borderWidth: 2
      }]
    };

    // Reason Chart (Bar Chart)
    const reasonLabels = Object.keys(this.statistics.reportsByReason);
    const reasonData = Object.values(this.statistics.reportsByReason);
    
    this.reasonChartData = {
      labels: reasonLabels,
      datasets: [{
        label: this.t('analytics.dashboard.reasonChartTitle'),
        data: reasonData,
        backgroundColor: this.reasonColors.slice(0, reasonLabels.length),
        borderWidth: 1      }]
    };

    // Timeline Chart (Line Chart)
    const timelineLabels = Object.keys(this.statistics.reportsLast7Days);
    const timelineData = Object.values(this.statistics.reportsLast7Days);
    
    this.timelineChartData = {
      labels: timelineLabels,
      datasets: [{
        label: this.t('analytics.dashboard.timelineChartTitle'),
        data: timelineData,
        borderColor: ['rgba(34, 211, 238, 1)'],
        backgroundColor: ['rgba(34, 211, 238, 0.1)'],
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: ['rgba(34, 211, 238, 0.7)'],
        pointBorderColor: ['rgba(34, 211, 238, 1)'],
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    };
  }

  /**
   * Get total reports count
   */
  getTotalReports(): number {
    return this.statistics?.totalReports || 0;
  }

  /**
   * Get status percentage
   */
  getStatusPercentage(status: 'pending' | 'underReview' | 'resolved' | 'rejected'): number {
    if (!this.statistics || this.statistics.totalReports === 0) return 0;
    
    const statusValue = {
      pending: this.statistics.pendingReports,
      underReview: this.statistics.underReviewReports,
      resolved: this.statistics.resolvedReports,
      rejected: this.statistics.rejectedReports
    }[status];
    
    return Math.round((statusValue / this.statistics.totalReports) * 100);
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.languageService.translate(key, params);
  }

  private buildLineChartOptions(): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          display: true,
          title: {
            display: true,
            text: this.t('analytics.dashboard.axis.reports')
          }
        },
        x: {
          display: true,
          title: {
            display: true,
            text: this.t('analytics.dashboard.axis.days')
          }
        }
      }
    };
  }
}
