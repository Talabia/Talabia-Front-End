import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Report,
  ReportsListRequest,
  ReportsListResponse,
  ChangeStatusRequest,
  BulkChangeStatusRequest,
  ReportReason,
  ApiResponse,
} from '../models/reports.models';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of reports with filters
   * GET /api/Reports/list?ReportType=1&ReportReasonId=0&Status=1&FromDate=2025-11-15T20%3A36%3A58.266Z&ToDate=2025-11-17T20%3A36%3A58.266Z&PageSize=1&CurrentPage=10
   */
  getReportsList(request: ReportsListRequest): Observable<ReportsListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.reportType !== undefined && request.reportType !== null) {
      params = params.set('ReportType', request.reportType.toString());
    }

    if (
      request.reportReasonId !== undefined &&
      request.reportReasonId !== null &&
      request.reportReasonId > 0
    ) {
      params = params.set('ReportReasonId', request.reportReasonId.toString());
    }

    if (request.status !== undefined && request.status !== null) {
      params = params.set('Status', request.status.toString());
    }

    if (request.fromDate && request.fromDate.trim()) {
      params = params.set('FromDate', request.fromDate.trim());
    }

    if (request.toDate && request.toDate.trim()) {
      params = params.set('ToDate', request.toDate.trim());
    }

    if (request.searchKeyword && request.searchKeyword.trim()) {
      // Try multiple parameter names to see which one works
      params = params.set('SearchKeyword', request.searchKeyword.trim());
      params = params.set('Search', request.searchKeyword.trim());
      params = params.set('Keyword', request.searchKeyword.trim());
      params = params.set('Filter', request.searchKeyword.trim());
      console.log('Setting SearchKeyword param:', request.searchKeyword.trim());
    }

    console.log('API Request URL:', `${this.baseUrl}Reports/list`);
    console.log('API Request params:', params.toString());
    console.log('Full request object:', request);

    return this.http.get<any>(`${this.baseUrl}Reports/list`, { params }).pipe(
      map((response) => {
        // Handle API response structure
        if (response && response.data) {
          return {
            data: response.data,
            totalCount: response.totalCount || 0,
            currentPage: response.currentPage || request.currentPage,
            pageSize: response.pageSize || request.pageSize,
            totalPages:
              response.totalPages ||
              Math.ceil((response.totalCount || 0) / (response.pageSize || request.pageSize)),
          };
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get single report by ID
   * GET /api/Reports/get?ReportId=3fa85f64-5717-4562-b3fc-2c963f66afa6
   */
  getReportById(reportId: string): Observable<Report> {
    const params = new HttpParams().set('ReportId', reportId);

    return this.http
      .get<Report>(`${this.baseUrl}Reports/get`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete report by ID
   * DELETE /api/Reports/delete?ReportId=3fa85f64-5717-4562-b3fc-2c963f66afa6
   */
  deleteReport(reportId: string): Observable<boolean> {
    const params = new HttpParams().set('ReportId', reportId);

    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}Reports/delete`, { params }).pipe(
      map((response) => response?.success ?? true),
      catchError(this.handleError)
    );
  }

  /**
   * Change status of a single report
   * PUT /api/Reports/change-status
   */
  changeReportStatus(request: ChangeStatusRequest): Observable<boolean> {
    return this.http
      .put<ApiResponse<boolean>>(`${this.baseUrl}Reports/change-status`, request)
      .pipe(
        map((response) => response?.success ?? true),
        catchError(this.handleError)
      );
  }

  /**
   * Change status of multiple reports (bulk operation)
   * PUT /api/Reports/bulk/change-status
   */
  bulkChangeReportStatus(request: BulkChangeStatusRequest): Observable<boolean> {
    return this.http
      .put<ApiResponse<boolean>>(`${this.baseUrl}Reports/bulk/change-status`, request)
      .pipe(
        map((response) => response?.success ?? true),
        catchError(this.handleError)
      );
  }

  /**
   * Get report reasons for dropdown
   * GET /api/Lookups/report-reasons
   */
  getReportReasons(): Observable<ReportReason[]> {
    return this.http
      .get<ReportReason[]>(`${this.baseUrl}Lookups/report-reasons`)
      .pipe(catchError(this.handleError));
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

    console.error('Reports Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
