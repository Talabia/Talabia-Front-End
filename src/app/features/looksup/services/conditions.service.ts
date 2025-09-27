import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  Condition, 
  CreateConditionRequest, 
  EditConditionRequest, 
  ConditionsListRequest, 
  ConditionsListResponse, 
  ApiResponse,
  DeleteConditionRequest 
} from '../models/condition.models';

@Injectable({
  providedIn: 'root'
})
export class ConditionsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of conditions with optional search
   * GET /api/Conditions/list?SearchKeyword=ff&PageSize=10&CurrentPage=1
   */
  getConditionsList(request: ConditionsListRequest): Observable<ConditionsListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    return this.http.get<any>(`${this.baseUrl}Conditions/list`, { params })
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
   * Get single condition by ID
   * GET /api/Conditions/get?Id=0
   */
  getConditionById(id: number): Observable<Condition> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.get<ApiResponse<Condition>>(`${this.baseUrl}Conditions/get`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new condition
   * POST /api/Conditions/create
   */
  createCondition(request: CreateConditionRequest): Observable<Condition> {
    return this.http.post<ApiResponse<Condition>>(`${this.baseUrl}Conditions/create`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Edit existing condition
   * PUT /api/Conditions/edit
   */
  editCondition(request: EditConditionRequest): Observable<Condition> {
    return this.http.put<ApiResponse<Condition>>(`${this.baseUrl}Conditions/edit`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Delete condition by ID
   * DELETE /api/Conditions/delete?Id=0
   */
  deleteCondition(id: number): Observable<boolean> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}Conditions/delete`, { params })
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

    console.error('Conditions Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
