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
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { LanguageService } from '../../../shared/services/language.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { StatisticsService } from '../services/statistics.service';
import { 
  VehicleAnalyticsResponse,
  ChartData,
  ChartOptions,
  ChartFilter
} from '../models/statistics.models';

@Component({
  selector: 'app-vehicle-statistics',
  imports: [
    CardModule,
    ChartModule,
    ButtonModule,
    Select,
    ToastModule,
    ProgressSpinnerModule,
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './vehicle-statistics.component.html',
  styleUrl: './vehicle-statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleStatisticsComponent implements OnInit, OnDestroy {
  loading = false;
  loadingMessage = '';

  // Data properties
  vehicleData?: VehicleAnalyticsResponse;

  // Filter properties
  selectedFilter: ChartFilter = ChartFilter.Daily;
  filterOptions = [
    { label: '', value: ChartFilter.Daily },
    { label: '', value: ChartFilter.Weekly },
    { label: '', value: ChartFilter.Monthly }
  ];

  // Chart data
  typesChartData?: ChartData;
  makersChartData?: ChartData;
  modelsChartData?: ChartData;
  priceChartData?: ChartData;

  // Chart options
  donutChartOptions!: ChartOptions;
  horizontalBarChartOptions!: ChartOptions;
  barChartOptions!: ChartOptions;

  // Color palettes - using green/emerald scheme
  private typeColors = [
    'rgba(16, 185, 129, 0.7)',   // emerald
    'rgba(52, 211, 153, 0.7)',   // emerald lighter
    'rgba(6, 182, 212, 0.7)',    // cyan
    'rgba(14, 165, 233, 0.7)',   // sky
    'rgba(59, 130, 246, 0.7)'    // blue
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private statisticsService: StatisticsService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private languageService: LanguageService
  ) {
    this.loadingMessage = this.t('analytics.vehicle.loading');
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
        this.loadingMessage = this.t('analytics.vehicle.loading');
        this.buildFilterOptions();
        this.initializeChartOptions();
        this.prepareChartData();
        this.cdr.markForCheck();
      });
  }

  private buildFilterOptions(): void {
    this.filterOptions = [
      { label: this.t('analytics.vehicle.filter.daily'), value: ChartFilter.Daily },
      { label: this.t('analytics.vehicle.filter.weekly'), value: ChartFilter.Weekly },
      { label: this.t('analytics.vehicle.filter.monthly'), value: ChartFilter.Monthly }
    ];
  }

  onFilterChange(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.statisticsService.getVehicleAnalytics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.vehicleData = data;
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

  private prepareChartData(): void {
    if (!this.vehicleData) return;

    // Types - Donut Chart
    this.typesChartData = {
      labels: this.vehicleData.vehicleTypes.map(v => v.label),
      datasets: [{
        data: this.vehicleData.vehicleTypes.map(v => v.value),
        backgroundColor: this.typeColors.slice(0, this.vehicleData.vehicleTypes.length),
        borderWidth: 0
      }]
    };

    // Makers - Horizontal Bar
    this.makersChartData = {
      labels: this.vehicleData.vehicleMakers.map(v => v.label),
      datasets: [{
        label: this.t('analytics.vehicle.makersChartTitle'),
        data: this.vehicleData.vehicleMakers.map(v => v.value),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderWidth: 0
      }]
    };

    // Models - Vertical Bar
    this.modelsChartData = {
      labels: this.vehicleData.vehicleModels.map(v => v.label),
      datasets: [{
        label: this.t('analytics.vehicle.modelsChartTitle'),
        data: this.vehicleData.vehicleModels.map(v => v.value),
        backgroundColor: 'rgba(52, 211, 153, 0.7)',
        borderWidth: 0
      }]
    };

    // Average Price - Column Chart
    const priceLabels = Object.keys(this.vehicleData.averagePriceByType);
    const priceValues = Object.values(this.vehicleData.averagePriceByType);

    this.priceChartData = {
      labels: priceLabels,
      datasets: [{
        label: 'Average Price (SAR)',
        data: priceValues,
        backgroundColor: 'rgba(52, 211, 153, 0.7)',
        borderWidth: 0
      }]
    };
  }

  private initializeChartOptions(): void {
    // Donut chart for types
    this.donutChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 12 },
            color: '#6b7280'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8
        }
      }
    };

    // Horizontal bar for makers
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

    // Vertical bar for models and prices
    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value.toLocaleString()} SAR`;
            }
          }
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
          ticks: { 
            color: '#6b7280',
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      elements: {
        bar: {
          borderRadius: { topLeft: 8, topRight: 8 },
          borderSkipped: 'bottom',
          barThickness: 24,
          maxBarThickness: 32
        }
      }
    };
  }

  private t(key: string): string {
    return this.languageService.translate(key);
  }
}
