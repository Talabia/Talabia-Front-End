import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  Theme, 
  CreateThemeRequest, 
  EditThemeRequest, 
  ThemesListRequest, 
  ThemesListResponse, 
  ApiResponse,
  SetActiveRequest,
  SetDefaultRequest
} from '../models/theme.models';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of Themes with optional search
   * GET /api/Themes/list?SearchKeyword=ff&PageSize=10&CurrentPage=1
   */
  getThemesList(request: ThemesListRequest): Observable<ThemesListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    return this.http.get<any>(`${this.baseUrl}Themes/list`, { params })
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
   * Get single Theme by ID
   * GET /api/Themes/get?Id=1
   */
  getThemeById(id: number): Observable<Theme> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.get<ApiResponse<Theme>>(`${this.baseUrl}Themes/get`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new Theme
   * POST /api/Themes/create
   */
  createTheme(request: CreateThemeRequest): Observable<Theme> {
    return this.http.post<ApiResponse<Theme>>(`${this.baseUrl}Themes/create`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Edit existing Theme
   * PUT /api/Themes/edit
   */
  editTheme(request: EditThemeRequest): Observable<Theme> {
    return this.http.put<ApiResponse<Theme>>(`${this.baseUrl}Themes/edit`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Delete Theme by ID
   * DELETE /api/Themes/delete?Id=20
   */
  deleteTheme(id: number): Observable<boolean> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}Themes/delete`, { params })
      .pipe(
        map(response => response.success),
        catchError(this.handleError)
      );
  }

  /**
   * Set theme active/inactive status
   * PUT /api/Themes/set/active
   */
  setActiveStatus(request: SetActiveRequest): Observable<boolean> {
    return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}Themes/set/active`, request)
      .pipe(
        map(response => response.success),
        catchError(this.handleError)
      );
  }

  /**
   * Set theme as default
   * PUT /api/Themes/set/default
   */
  setDefaultTheme(request: SetDefaultRequest): Observable<boolean> {
    return this.http.put<ApiResponse<boolean>>(`${this.baseUrl}Themes/set/default`, request)
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

    console.error('Theme Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
