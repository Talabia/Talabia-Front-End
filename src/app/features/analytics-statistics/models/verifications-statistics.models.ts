// Date Range Filter Enum
export enum DateRangeFilter {
  Last7Days = 1,
  Last30Days = 2,
  Last90Days = 3,
  ThisYear = 4,
}

// Chart Data Point Interface
export interface ChartDataPoint {
  label: string;
  value: number;
}

// Verifications Statistics Models
export interface VerificationsStatistics {
  // Summary Counts
  totalPending: number;
  totalUnderReview: number;
  totalApproved: number;
  totalRejected: number;
  totalRequiresUpdate: number;
  totalSubmissions: number;

  // Time-based Submissions
  todaySubmissions: number;
  thisWeekSubmissions: number;
  thisMonthSubmissions: number;

  // Approval Rates
  approvalRate: number;
  rejectionRate: number;

  // Chart Data Arrays
  submissionsOverTime: ChartDataPoint[];
  statusDistribution: ChartDataPoint[];
  approvalTrend: ChartDataPoint[];
}
