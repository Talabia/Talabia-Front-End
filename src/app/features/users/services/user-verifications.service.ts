import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  VerificationsListRequest,
  VerificationsListResponse,
  VerificationDetailsResponse,
  ReviewVerificationRequest,
} from '../models/user-verifications.models';

@Injectable({
  providedIn: 'root',
})
export class UserVerificationsService {
  private readonly apiUrl = `${environment.baseUrl}UserVerifications`;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of user verifications with filters
   */
  getVerificationsList(
    request: VerificationsListRequest
  ): Observable<VerificationsListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.status !== undefined && request.status !== null) {
      params = params.set('Status', request.status.toString());
    }

    if (request.fromDate) {
      params = params.set('FromDate', request.fromDate);
    }

    if (request.toDate) {
      params = params.set('ToDate', request.toDate);
    }

    if (request.searchTerm && request.searchTerm.trim()) {
      params = params.set('SearchTerm', request.searchTerm.trim());
    }

    return this.http
      .get<VerificationsListResponse>(`${this.apiUrl}/list`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get verification details by verification ID and user ID
   */
  getVerificationDetails(
    verificationId: string,
    userId: string
  ): Observable<VerificationDetailsResponse> {
    const params = new HttpParams()
      .set('VerificationId', verificationId)
      .set('userId', userId);

    return this.http
      .get<VerificationDetailsResponse>(`${this.apiUrl}/details`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Review/update verification status
   */
  reviewVerification(
    request: ReviewVerificationRequest
  ): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/admin/verifications/review`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      // Server-side error with message
      errorMessage = error.error.message;
    } else if (error.message) {
      // HTTP error
      errorMessage = error.message;
    }

    console.error('API Error:', error);
    return throwError(() => ({ message: errorMessage }));
  }
}
