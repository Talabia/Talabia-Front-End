import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AdminOffer,
  AdminOffersListRequest,
  AdminOffersListResponse,
  ApiResponse,
  PromoteOfferRequest,
} from '../models/content-mangement.models';

@Injectable({
  providedIn: 'root',
})
export class ContentMangementService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of admin offers with optional filters
   * GET /api/AdminOffers/list?FromDate=1-11-2025&ToDate=2025-12-04T00%3A00%3A00&Duration=1&SearchKeyword=gg&IsActive=false&IsPromoted=true&PageSize=20&CurrentPage=1
   */
  getAdminOffersList(request: AdminOffersListRequest): Observable<AdminOffersListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.fromDate) {
      params = params.set('FromDate', request.fromDate);
    }

    if (request.toDate) {
      params = params.set('ToDate', request.toDate);
    }

    if (request.duration !== undefined) {
      params = params.set('Duration', request.duration.toString());
    }

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    if (request.isActive !== undefined) {
      params = params.set('IsActive', request.isActive.toString());
    }

    if (request.isPromoted !== undefined) {
      params = params.set('IsPromoted', request.isPromoted.toString());
    }

    return this.http.get<any>(`${this.baseUrl}AdminOffers/list`, { params }).pipe(
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
   * Get single admin offer by ID
   * GET /api/AdminOffers/get/details?Id=3fa85f64-5717-4562-b3fc-2c963f66afa6
   */
  getAdminOfferById(id: string): Observable<AdminOffer> {
    const params = new HttpParams().set('Id', id);

    return this.http.get<any>(`${this.baseUrl}AdminOffers/get/details`, { params }).pipe(
      map((response) => response.data || response),
      catchError(this.handleError)
    );
  }

  /**
   * Delete admin offer by ID
   * DELETE /api/AdminOffers/delete?Id=3fa85f64-5717-4562-b3fc-2c963f66afa6
   */
  deleteAdminOffer(id: string): Observable<boolean> {
    const params = new HttpParams().set('Id', id);

    return this.http
      .delete<ApiResponse<boolean>>(`${this.baseUrl}AdminOffers/delete`, { params })
      .pipe(
        map((response) => response.success),
        catchError(this.handleError)
      );
  }

  /**
   * Promote or unpromote admin offer
   * POST /api/AdminOffers/promote
   */
  promoteAdminOffer(request: PromoteOfferRequest): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}AdminOffers/promote`, request).pipe(
      map((response) => response.success),
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

    console.error('Content Management Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
