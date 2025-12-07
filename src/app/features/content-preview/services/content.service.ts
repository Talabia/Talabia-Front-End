import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AdminContent,
  CreateAdminContentRequest,
  EditAdminContentRequest,
  AdminContentListRequest,
  AdminContentListResponse,
  ApiResponse,
  AdminContentDetailsResponse
} from '../models/content.models';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of admin contents
   * GET /api/AdminContents/list?Type=1&PageSize=10&CurrentPage=1
   */
  getAdminContentList(request: AdminContentListRequest): Observable<AdminContentListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.type) {
      params = params.set('Type', request.type.toString());
    }

    return this.http.get<any>(`${this.baseUrl}AdminContents/list`, { params })
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
   * Get single content by ID for editing
   * GET /api/AdminContents/get?id={id}
   */
  getAdminContentById(id: number): Observable<AdminContent> {
    const params = new HttpParams().set('id', id.toString());

    return this.http.get<any>(`${this.baseUrl}AdminContents/get`, { params })
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  /**
   * Get content details by ID for preview
   * GET /api/AdminContents/get/details?id={id}
   */
  getAdminContentDetails(id: number): Observable<AdminContentDetailsResponse> {
    const params = new HttpParams().set('id', id.toString());

    return this.http.get<any>(`${this.baseUrl}AdminContents/get/details`, { params })
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new admin content
   * POST /api/AdminContents/create
   */
  createAdminContent(request: CreateAdminContentRequest): Observable<AdminContent> {
    return this.http.post<any>(`${this.baseUrl}AdminContents/create`, request)
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  /**
   * Edit existing admin content
   * PUT /api/AdminContents/edit
   */
  editAdminContent(request: EditAdminContentRequest): Observable<AdminContent> {
    return this.http.put<any>(`${this.baseUrl}AdminContents/edit`, request)
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  /**
   * Delete admin content by ID
   * DELETE /api/AdminContents/delete?id={id}
   */
  deleteAdminContent(id: number): Observable<boolean> {
    const params = new HttpParams().set('id', id.toString());

    return this.http.delete<any>(`${this.baseUrl}AdminContents/delete`, { params })
      .pipe(
        map(response => response.success || true),
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

    console.error('Admin Content Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
