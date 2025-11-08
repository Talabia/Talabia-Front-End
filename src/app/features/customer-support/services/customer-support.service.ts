import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  ContactUs, 
  ContactUsListRequest, 
  ContactUsListResponse, 
  ApiResponse,
  MarkReadRequest
} from '../models/customer-support.models';

@Injectable({
  providedIn: 'root'
})
export class CustomerSupportService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of Contact Us messages with optional search
   * GET /api/ContactUs/list?SearchKeyword=ff&PageSize=10&CurrentPage=1
   */
  getContactUsList(request: ContactUsListRequest): Observable<ContactUsListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    return this.http.get<any>(`${this.baseUrl}ContactUs/list`, { params })
      .pipe(
        map(response => {
          // Handle API response structure
          if (response && response.data) {
            return {
              data: response.data,
              totalCount: response.totalCount || 0,
              currentPage: response.currentPage || request.currentPage,
              pageSize: response.pageSize || request.pageSize,
              totalPages: response.totalPages || Math.ceil((response.totalCount || 0) / (response.pageSize || request.pageSize))
            };
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get single Contact Us message by ID
   * GET /api/ContactUs/get?Id=3fa85f64-5717-4562-b3fc-2c963f66afa6
   */
  getContactUsById(id: string): Observable<ContactUs> {
    const params = new HttpParams().set('Id', id);
    
    return this.http.get<any>(`${this.baseUrl}ContactUs/get`, { params })
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  /**
   * Mark Contact Us message as read
   * PUT /api/ContactUs/mark/read
   */
  markAsRead(request: MarkReadRequest): Observable<boolean> {
    return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}ContactUs/mark/read`, request)
      .pipe(
        map(response => response.success),
        catchError(this.handleError)
      );
  }

  /**
   * Delete Contact Us message by ID
   * DELETE /api/ContactUs/delete?Id=3fa85f64-5717-4562-b3fc-2c963f66afa6
   */
  deleteContactUs(id: string): Observable<boolean> {
    const params = new HttpParams().set('Id', id);
    
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}ContactUs/delete`, { params })
      .pipe(
        map(response => response.success),
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

    console.error('Customer Support Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
