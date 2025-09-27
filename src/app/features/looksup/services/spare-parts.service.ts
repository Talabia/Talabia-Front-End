import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  SparePartsStatus, 
  CreateSparePartsStatusRequest, 
  EditSparePartsStatusRequest, 
  SparePartsStatusListRequest, 
  SparePartsStatusListResponse, 
  ApiResponse,
  DeleteSparePartsStatusRequest 
} from '../models/spare-parts-status.models';

@Injectable({
  providedIn: 'root'
})
export class SparePartsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of spare parts status with optional search
   * GET /api/SparePartsStatus/list?SearchKeyword=ff&PageSize=10&CurrentPage=1
   */
  getSparePartsStatusList(request: SparePartsStatusListRequest): Observable<SparePartsStatusListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    return this.http.get<any>(`${this.baseUrl}SparePartsStatus/list`, { params })
      .pipe(
        map(response => {
          // Handle API response structure
          if (response && response.data) {
            return {
              data: response.data,
              totalRecords: response.totalCount || response.totalRecords || 0,
              currentPage: response.currentPage || request.currentPage,
              pageSize: response.pageSize || request.pageSize,
              totalPages: response.totalPages || Math.ceil((response.totalCount || response.totalRecords || 0) / (response.pageSize || request.pageSize))
            };
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get single spare parts status by ID
   * GET /api/SparePartsStatus/get?Id=0
   */
  getSparePartsStatusById(id: number): Observable<SparePartsStatus> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.get<ApiResponse<SparePartsStatus>>(`${this.baseUrl}SparePartsStatus/get`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new spare parts status
   * POST /api/SparePartsStatus/create
   */
  createSparePartsStatus(request: CreateSparePartsStatusRequest): Observable<SparePartsStatus> {
    return this.http.post<ApiResponse<SparePartsStatus>>(`${this.baseUrl}SparePartsStatus/create`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Edit existing spare parts status
   * PUT /api/SparePartsStatus/edit
   */
  editSparePartsStatus(request: EditSparePartsStatusRequest): Observable<SparePartsStatus> {
    return this.http.put<ApiResponse<SparePartsStatus>>(`${this.baseUrl}SparePartsStatus/edit`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Delete spare parts status by ID
   * DELETE /api/SparePartsStatus/delete?Id=0
   */
  deleteSparePartsStatus(id: number): Observable<boolean> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}SparePartsStatus/delete`, { params })
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

    console.error('Spare Parts Status Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
