import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  VerificationsStatistics,
  DateRangeFilter,
} from '../models/verifications-statistics.models';

@Injectable({
  providedIn: 'root',
})
export class VerificationsStatisticsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get verifications statistics
   * @param filter Date range filter (defaults to Last7Days)
   */
  getVerificationsStatistics(
    filter: DateRangeFilter = DateRangeFilter.Last7Days
  ): Observable<VerificationsStatistics> {
    const url = `${this.baseUrl}UserVerifications/statistics`;
    const params = new HttpParams().set('Filter', filter.toString());

    return this.http
      .get<VerificationsStatistics>(url, { params })
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

    console.error('Verifications Statistics Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
