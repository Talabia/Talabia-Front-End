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
  CitiesListResponse,
} from '../models/notifications-center';

@Injectable({
  providedIn: 'root',
})
export class NotificationsCenterService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of notifications with optional search and date range filter
   * GET /api/Notifications/admin/list?PageSize=10&CurrentPage=1&SearchKeyword=test&FromDate=2024-01-01&ToDate=2024-12-31
   */
  getNotificationsList(request: NotificationsListRequest): Observable<NotificationsListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    if (request.fromDate) {
      params = params.set('FromDate', request.fromDate);
    }

    if (request.toDate) {
      params = params.set('ToDate', request.toDate);
    }

    return this.http
      .get<NotificationsListResponse>(`${this.baseUrl}Notifications/admin/list`, { params })
      .pipe(
        map((response) => response),
        catchError(this.handleError)
      );
  }

  /**
   * Send a notification to users
   * POST /api/Notifications/admin/send
   */
  sendNotification(request: SendNotificationRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}Notifications/admin/send`, request).pipe(
      map((response) => response),
      catchError(this.handleError)
    );
  }

  /**
   * Get list of cities for specific city targeting
   * GET /api/Cities/list (with large page size to get all cities)
   */
  getCities(): Observable<City[]> {
    // Use the Cities/list endpoint with a large page size to get all cities
    const params = new HttpParams()
      .set('PageSize', '1000') // Large page size to get all cities
      .set('CurrentPage', '1');

    return this.http.get<any>(`${this.baseUrl}Cities/list`, { params }).pipe(
      map((response) => {
        let cities: any[] = [];

        // Try different response structures
        if (response && response.data && Array.isArray(response.data)) {
          cities = response.data;
        } else if (Array.isArray(response)) {
          cities = response;
        }

        // Ensure each city has the required properties and map to correct format
        const validCities = cities
          .filter((city) => {
            const hasId = city && (city.id !== undefined || city.Id !== undefined);
            const hasNameEn = city && (city.nameEn !== undefined || city.NameEn !== undefined);

            return hasId && hasNameEn;
          })
          .map((city) => ({
            id: city.id || city.Id,
            nameEn: city.nameEn || city.NameEn || '',
            nameAr: city.nameAr || city.NameAr || '',
          }));

        return validCities;
      }),
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
