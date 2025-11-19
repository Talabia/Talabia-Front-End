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
  value: string | null;
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
  All = 'all',
  Last7Days = 'last7days',
  Last30Days = 'last30days',
  Last90Days = 'last90days',
  ThisYear = 'thisyear'
}
