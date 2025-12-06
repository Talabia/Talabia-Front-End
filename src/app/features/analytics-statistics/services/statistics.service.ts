import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  DashboardOverview,
  OffersChartResponse,
  OrdersChartResponse,
  CityStatsResponse,
  UserStatsResponse,
  VehicleAnalyticsResponse,
  CategoryPerformanceResponse,
  UserEngagementResponse,
  ReviewAnalyticsResponse,
  ChartFilter,
} from '../models/statistics.models';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private readonly baseUrl = `${environment.baseUrl}Statistics`;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard overview statistics
   */
  getDashboardOverview(): Observable<DashboardOverview> {
    return this.http
      .get<DashboardOverview>(`${this.baseUrl}/dashboard-overview`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get offers chart data
   * @param filter Time period filter (1=Daily, 2=Weekly, 3=Monthly)
   */
  getOffersChart(filter: ChartFilter): Observable<OffersChartResponse> {
    const params = new HttpParams().set('Filter', filter.toString());
    return this.http
      .get<OffersChartResponse>(`${this.baseUrl}/offers-chart`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get orders chart data
   * @param filter Time period filter (1=Daily, 2=Weekly, 3=Monthly)
   */
  getOrdersChart(filter: ChartFilter): Observable<OrdersChartResponse> {
    const params = new HttpParams().set('Filter', filter.toString());
    return this.http
      .get<OrdersChartResponse>(`${this.baseUrl}/orders-chart`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get most active cities
   * @param topCount Number of cities to return
   * @param filter Time period filter (1=Daily, 2=Weekly, 3=Monthly)
   */
  getMostActiveCities(topCount: number = 10, filter?: ChartFilter): Observable<CityStatsResponse> {
    let params = new HttpParams().set('TopCount', topCount.toString());
    if (filter) {
      params = params.set('Filter', filter.toString());
    }
    return this.http
      .get<CityStatsResponse>(`${this.baseUrl}/most-active-cities`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get most active users
   * @param topCount Number of users to return
   */
  getMostActiveUsers(topCount: number = 10): Observable<UserStatsResponse> {
    const params = new HttpParams().set('TopCount', topCount.toString());
    return this.http
      .get<UserStatsResponse>(`${this.baseUrl}/most-active-users`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get vehicle analytics data
   */
  getVehicleAnalytics(): Observable<VehicleAnalyticsResponse> {
    return this.http
      .get<VehicleAnalyticsResponse>(`${this.baseUrl}/vehicle-analytics`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get category performance data
   * @param filter Time period filter (1=Daily, 2=Weekly, 3=Monthly)
   */
  getCategoryPerformance(filter?: ChartFilter): Observable<CategoryPerformanceResponse> {
    let params = new HttpParams();
    if (filter) {
      params = params.set('Filter', filter.toString());
    }
    return this.http
      .get<CategoryPerformanceResponse>(`${this.baseUrl}/category-performance`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get user engagement data
   * @param filter Time period filter (1=Daily, 2=Weekly, 3=Monthly)
   */
  getUserEngagement(filter: ChartFilter = ChartFilter.Daily): Observable<UserEngagementResponse> {
    const params = new HttpParams().set('Filter', filter.toString());
    return this.http
      .get<UserEngagementResponse>(`${this.baseUrl}/user-engagement`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get review analytics data
   * @param daysBack Number of days to look back
   * @param topCount Number of top items to return
   */
  getReviewAnalytics(
    daysBack: number = 30,
    topCount: number = 10
  ): Observable<ReviewAnalyticsResponse> {
    const params = new HttpParams()
      .set('DaysBack', daysBack.toString())
      .set('TopItemsCount', topCount.toString());
    return this.http
      .get<ReviewAnalyticsResponse>(`${this.baseUrl}/review-analytics`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.status >= 400 && error.status < 500) {
        errorMessage = error.error?.message || `Client error: ${error.status}`;
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.error?.message || `HTTP error: ${error.status}`;
      }
    }

    console.error('Statistics Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
