// Dashboard Statistics Models
export interface DashboardStatistics {
  totalReports: number;
  pendingReports: number;
  underReviewReports: number;
  resolvedReports: number;
  rejectedReports: number;
  reportsByType: { [key: string]: number };
  reportsByReason: { [key: string]: number };
  reportsLast7Days: { [key: string]: number };
}

// Filter options for dashboard
export interface DashboardFilterOption {
  label: string;
  value: number;
}

// Chart data interfaces for PrimeNG charts
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointBackgroundColor?: string[];
  pointBorderColor?: string[];
  pointRadius?: number;
  pointHoverRadius?: number;
}

// Chart options interface
export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      position: string;
      display: boolean;
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  scales?: {
    x?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
    y?: {
      display: boolean;
      beginAtZero: boolean;
      title?: {
        display: boolean;
        text: string;
      };
    };
  };
}

// Enum for filter types
export enum DashboardFilterEnum {
  Last7Days = 1,
  Last30Days = 2,
  Last90Days = 3,
  ThisYear = 4,
}
