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

import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { LanguageService } from '../../../shared/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { StatisticsService } from '../services/statistics.service';
import { 
  UserEngagementResponse,
  UserStatsResponse,
  ReviewAnalyticsResponse,
  ChartData,
  ChartOptions,
  UserStats,
  TopRatedUser
} from '../models/statistics.models';

@Component({
  selector: 'app-user-statistics',
  imports: [
    CardModule,
    ChartModule,
    ButtonModule,
    ToastModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
    CommonModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './user-statistics.component.html',
  styleUrl: './user-statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserStatisticsComponent implements OnInit, OnDestroy {
  loading = false;
  loadingMessage = '';

  // Data properties
  engagementData?: UserEngagementResponse;
  activeUsersData?: UserStatsResponse;
  reviewData?: ReviewAnalyticsResponse;

  // Filter properties
  selectedFilter: number = 30;
  filterOptions = [
    { label: '', value: 7 },
    { label: '', value: 30 },
    { label: '', value: 90 }
  ];

  // Chart data
  registrationsChartData?: ChartData;
  engagementChartData?: ChartData;
  ratingDistributionChartData?: ChartData;

  // Chart options
  lineChartOptions!: ChartOptions;
  multiLineChartOptions!: ChartOptions;
  horizontalBarChartOptions!: ChartOptions;

  // Color palettes - using purple/violet scheme
  private primaryColor = 'rgba(139, 92, 246, 1)';
  private secondaryColor = 'rgba(236, 72, 153, 1)';
  private tertiaryColor = 'rgba(14, 165, 233, 1)';
  private ratingColors = [
    'rgba(239, 68, 68, 0.7)',    // 1 star - red
    'rgba(249, 115, 22, 0.7)',   // 2 stars - orange
    'rgba(234, 179, 8, 0.7)',    // 3 stars - yellow
    'rgba(132, 204, 22, 0.7)',   // 4 stars - lime
    'rgba(34, 197, 94, 0.7)'     // 5 stars - green
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private statisticsService: StatisticsService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private languageService: LanguageService
  ) {
    this.loadingMessage = this.t('analytics.user.loading');
    this.buildFilterOptions();
    this.initializeChartOptions();
    this.observeLanguageChanges();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private observeLanguageChanges(): void {
    this.languageService.languageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadingMessage = this.t('analytics.user.loading');
        this.buildFilterOptions();
        this.initializeChartOptions();
        this.prepareChartData();
        this.cdr.markForCheck();
      });
  }

  private buildFilterOptions(): void {
    this.filterOptions = [
      { label: this.t('analytics.dashboard.filter.7'), value: 7 },
      { label: this.t('analytics.dashboard.filter.30'), value: 30 },
      { label: this.t('analytics.dashboard.filter.90'), value: 90 }
    ];
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      engagement: this.statisticsService.getUserEngagement(this.selectedFilter),
      activeUsers: this.statisticsService.getMostActiveUsers(10),
      reviews: this.statisticsService.getReviewAnalytics(this.selectedFilter, 10)
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.engagementData = data.engagement;
        this.activeUsersData = data.activeUsers;
        this.reviewData = data.reviews;
        this.prepareChartData();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: this.t('common.error'),
          detail: error.message,
          life: 5000
        });
        this.cdr.markForCheck();
      }
    });
  }

  onFilterChange(): void {
    this.loadData();
  }

  private prepareChartData(): void {
    this.prepareRegistrationsChart();
    this.prepareEngagementChart();
    this.prepareRatingDistributionChart();
  }

  private prepareRegistrationsChart(): void {
    if (!this.engagementData) return;

    this.registrationsChartData = {
      labels: this.engagementData.newUserRegistrations.map(d => d.label),
      datasets: [{
        label: this.t('analytics.user.registrationsChartTitle'),
        data: this.engagementData.newUserRegistrations.map(d => d.value),
        borderColor: this.primaryColor,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: this.primaryColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
    };
  }

  private prepareEngagementChart(): void {
    if (!this.engagementData) return;

    this.engagementChartData = {
      labels: this.engagementData.commentsPerDay.map(d => d.label),
      datasets: [
        {
          label: 'Comments',
          data: this.engagementData.commentsPerDay.map(d => d.value),
          borderColor: this.primaryColor,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 3,
          tension: 0.4
        },
        {
          label: 'Favorites',
          data: this.engagementData.favoritesPerDay.map(d => d.value),
          borderColor: this.secondaryColor,
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderWidth: 3,
          tension: 0.4
        },
        {
          label: 'Follows',
          data: this.engagementData.followsPerDay.map(d => d.value),
          borderColor: this.tertiaryColor,
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 3,
          tension: 0.4
        }
      ]
    };
  }

  private prepareRatingDistributionChart(): void {
    if (!this.reviewData) return;

    const ratings = Object.keys(this.reviewData.ratingDistribution).sort();
    const counts = ratings.map(r => this.reviewData!.ratingDistribution[r]);

    this.ratingDistributionChartData = {
      labels: ratings.map(r => `${r} Stars`),
      datasets: [{
        label: 'Reviews',
        data: counts,
        backgroundColor: this.ratingColors,
        borderWidth: 0
      }]
    };
  }

  getRankBadgeClass(index: number): string {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return 'rank-other';
  }

  getStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
  }

  private initializeChartOptions(): void {
    // Single line chart for registrations
    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { color: '#6b7280' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', maxRotation: 0 }
        }
      }
    };

    // Multi-line chart for engagement
    this.multiLineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          position: 'bottom',
          labels: { color: '#6b7280' }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { color: '#6b7280' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', maxRotation: 0 }
        }
      }
    };

    // Horizontal bar for rating distribution
    this.horizontalBarChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { color: '#6b7280' }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#6b7280' }
        }
      },
      elements: {
        bar: {
          borderRadius: { topRight: 8, bottomRight: 8 },
          borderSkipped: false
        }
      }
    };
  }

  private t(key: string): string {
    return this.languageService.translate(key);
  }
}
