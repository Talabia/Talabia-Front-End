import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Notification,
  SendNotificationRequest,
  NotificationsListRequest,
  NotificationsListResponse,
  City,
  CitiesListResponse
} from '../models/notifications-center';

@Injectable({
  providedIn: 'root'
})
export class NotificationsCenterService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of notifications with optional search and date range filter
   * GET /api/Notifications/admin/list?PageSize=10&CurrentPage=1&SearchKeyword=test&StartDate=2024-01-01&EndDate=2024-12-31
   */
  getNotificationsList(request: NotificationsListRequest): Observable<NotificationsListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    if (request.startDate) {
      params = params.set('StartDate', request.startDate);
    }

    if (request.endDate) {
      params = params.set('EndDate', request.endDate);
    }

    return this.http.get<NotificationsListResponse>(`${this.baseUrl}Notifications/admin/list`, { params })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Send a notification to users
   * POST /api/Notifications/admin/send
   */
  sendNotification(request: SendNotificationRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}Notifications/admin/send`, request)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Get list of cities for specific city targeting
   * GET /api/Lookups/cities
   */
  getCities(): Observable<City[]> {
    return this.http.get<CitiesListResponse>(`${this.baseUrl}Lookups/cities`)
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * Centralized error handling
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Bad Request: Please check your input data';
            break;
          case 401:
            errorMessage = 'Unauthorized: Please log in again';
            break;
          case 403:
            errorMessage = 'Forbidden: You do not have permission to perform this action';
            break;
          case 404:
            errorMessage = 'Not Found: The requested resource was not found';
            break;
          case 500:
            errorMessage = 'Internal Server Error: Please try again later';
            break;
          default:
            errorMessage = `Server Error: ${error.status} - ${error.message}`;
        }
      }
    }

    console.error('Notifications Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
