import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { DashboardStatistics } from '../models/dashboard-statistics.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard statistics
   * @param filter Optional filter value (1=Last7Days, 2=Last30Days, 3=Last90Days, 4=ThisYear)
   */
  getDashboardStatistics(filter?: number): Observable<DashboardStatistics> {
    let url = `${this.baseUrl}Reports/statistics`;

    if (filter) {
      url += `?Filter=${filter}`;
    }

    return this.http.get<DashboardStatistics>(url).pipe(catchError(this.handleError));
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

    console.error('Dashboard Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
