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
    FormsModule
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
  filterOptions: DashboardFilterOption[] = [
    { label: 'All Time', value: DashboardFilterEnum.All },
    { label: 'Last 7 Days', value: DashboardFilterEnum.Last7Days },
    { label: 'Last 30 Days', value: DashboardFilterEnum.Last30Days },
    { label: 'Last 90 Days', value: DashboardFilterEnum.Last90Days },
    { label: 'This Year', value: DashboardFilterEnum.ThisYear }
  ];

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

  lineChartOptions: ChartOptions = {
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
          text: 'Number of Reports'
        }
      },
      x: {
        display: true,
        title: {
          display: true,
          text: 'Days'
        }
      }
    }
  };

  // Color palettes
  private statusColors = [ '#22D3EE', '#38BDF8', '#60A5FA', '#818CF8','#2DD4BF'];
  private typeColors = ['#38BDF8', '#60A5FA', '#818CF8'];
  private reasonColors = [ '#22D3EE', '#38BDF8', '#60A5FA', '#818CF8','#2DD4BF'];

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
            summary: 'Error',
            detail: error.message || 'Failed to load dashboard data',
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
      labels: ['Pending', 'Under Review', 'Resolved', 'Rejected'],
      datasets: [{
        label: 'Reports by Status',
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
        label: 'Reports by Type',
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
        label: 'Reports by Reason',
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
        label: 'Reports Last 7 Days',
        data: timelineData,
        borderColor: ['#22D3EE'],
        borderWidth: 3,
        fill: true
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
}
