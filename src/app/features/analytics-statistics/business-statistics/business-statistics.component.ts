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
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { LanguageService } from '../../../shared/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { StatisticsService } from '../services/statistics.service';
import { 
  DashboardOverview,
  OffersChartResponse,
  OrdersChartResponse,
  CityStatsResponse,
  CategoryPerformanceResponse,
  ChartFilter,
  ChartData,
  ChartOptions
} from '../models/statistics.models';

@Component({
  selector: 'app-business-statistics',
  imports: [
    CardModule,
    ChartModule,
    ButtonModule,
    Select,
    ToastModule,
    ProgressSpinnerModule,
    TableModule,
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './business-statistics.component.html',
  styleUrl: './business-statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessStatisticsComponent implements OnInit, OnDestroy {
  loading = false;
  loadingMessage = '';

  // Data properties
  dashboardData?: DashboardOverview;
  offersData?: OffersChartResponse;
  ordersData?: OrdersChartResponse;
  citiesData?: CityStatsResponse;
  categoryData?: CategoryPerformanceResponse;

  // Filter properties
  selectedOffersFilter: ChartFilter = ChartFilter.Daily;
  selectedOrdersFilter: ChartFilter = ChartFilter.Daily;
  filterOptions = [
    { label: '', value: ChartFilter.Daily },
    { label: '', value: ChartFilter.Weekly },
    { label: '', value: ChartFilter.Monthly }
  ];

  // Chart data
  offersChartData?: ChartData;
  ordersChartData?: ChartData;
  citiesChartData?: ChartData;
  categoryChartData?: ChartData;

  // Chart options
  lineChartOptions!: ChartOptions;
  barChartOptions!: ChartOptions;
  horizontalBarChartOptions!: ChartOptions;

  // Color palettes
  private offersColor = 'rgba(102, 126, 234, 1)';
  private offersColorLight = 'rgba(102, 126, 234, 0.1)';
  private ordersColor = 'rgba(245, 158, 11, 1)';
  private ordersColorLight = 'rgba(245, 158, 11, 0.1)';
  private cityColor = 'rgba(56, 189, 248, 0.7)';
  private categoryColors = [
    'rgba(102, 126, 234, 0.7)',
    'rgba(245, 158, 11, 0.7)'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private statisticsService: StatisticsService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private languageService: LanguageService
  ) {
    this.loadingMessage = this.t('analytics.business.loading');
    this.initializeChartOptions();
    this.buildFilterOptions();
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
        this.loadingMessage = this.t('analytics.business.loading');
        this.buildFilterOptions();
        this.initializeChartOptions();
        this.prepareChartData();
        this.cdr.markForCheck();
      });
  }

  private buildFilterOptions(): void {
    this.filterOptions = [
      { label: this.t('analytics.business.filter.daily'), value: ChartFilter.Daily },
      { label: this.t('analytics.business.filter.weekly'), value: ChartFilter.Weekly },
      { label: this.t('analytics.business.filter.monthly'), value: ChartFilter.Monthly }
    ];
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      dashboard: this.statisticsService.getDashboardOverview(),
      offers: this.statisticsService.getOffersChart(this.selectedOffersFilter),
      orders: this.statisticsService.getOrdersChart(this.selectedOrdersFilter),
      cities: this.statisticsService.getMostActiveCities(10),
      categories: this.statisticsService.getCategoryPerformance()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.dashboardData = data.dashboard;
        this.offersData = data.offers;
        this.ordersData = data.orders;
        this.citiesData = data.cities;
        this.categoryData = data.categories;
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

  onOffersFilterChange(): void {
    this.loading = true;
    this.statisticsService.getOffersChart(this.selectedOffersFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.offersData = data;
          this.prepareOffersChart();
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

  onOrdersFilterChange(): void {
    this.loading = true;
    this.statisticsService.getOrdersChart(this.selectedOrdersFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.ordersData = data;
          this.prepareOrdersChart();
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

  private prepareChartData(): void {
    this.prepareOffersChart();
    this.prepareOrdersChart();
    this.prepareCitiesChart();
    this.prepareCategoryChart();
  }

  private prepareOffersChart(): void {
    if (!this.offersData) return;

    this.offersChartData = {
      labels: this.offersData.chartData.map(d => d.label),
      datasets: [{
        label: this.t('analytics.business.offersChartTitle'),
        data: this.offersData.chartData.map(d => d.value),
        borderColor: this.offersColor,
        backgroundColor: this.offersColorLight,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: this.offersColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
    };
  }

  private prepareOrdersChart(): void {
    if (!this.ordersData) return;

    this.ordersChartData = {
      labels: this.ordersData.chartData.map(d => d.label),
      datasets: [{
        label: this.t('analytics.business.ordersChartTitle'),
        data: this.ordersData.chartData.map(d => d.value),
        borderColor: this.ordersColor,
        backgroundColor: this.ordersColorLight,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: this.ordersColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
    };
  }

  private prepareCitiesChart(): void {
    if (!this.citiesData) return;

    this.citiesChartData = {
      labels: this.citiesData.cities.map(c => c.cityName),
      datasets: [{
        label: this.t('analytics.business.citiesChartTitle'),
        data: this.citiesData.cities.map(c => c.totalActivity),
        backgroundColor: this.cityColor,
        borderWidth: 0
      }]
    };
  }

  private prepareCategoryChart(): void {
    if (!this.categoryData) return;

    this.categoryChartData = {
      labels: this.categoryData.offersByCategory.map(c => c.label),
      datasets: [
        {
          label: 'Offers',
          data: this.categoryData.offersByCategory.map(c => c.value),
          backgroundColor: this.categoryColors[0],
          borderWidth: 0
        },
        {
          label: 'Orders',
          data: this.categoryData.ordersByCategory.map(c => c.value),
          backgroundColor: this.categoryColors[1],
          borderWidth: 0
        }
      ]
    };
  }

  private initializeChartOptions(): void {
    // Line chart for offers/orders
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
          ticks: { color: 'var(--p-text-muted-color)' }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'var(--p-text-muted-color)', maxRotation: 0 }
        }
      }
    };

    // Horizontal bar for cities
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
          ticks: { color: 'var(--p-text-muted-color)' }
        },
        y: {
          grid: { display: false },
          ticks: { color: 'var(--p-text-muted-color)' }
        }
      },
      elements: {
        bar: {
          borderRadius: { topRight: 8, bottomRight: 8 }
        }
      }
    };

    // Grouped bar for categories
    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          position: 'top',
          align: 'end'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { color: 'var(--p-text-muted-color)' }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'var(--p-text-muted-color)' }
        }
      },
      elements: {
        bar: {
          borderRadius: { topLeft: 8, topRight: 8 }
        }
      }
    };
  }

  private t(key: string): string {
    return this.languageService.translate(key);
  }
}
