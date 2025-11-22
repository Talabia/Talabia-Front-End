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
  SetDefaultRequest,
  ThemeDetailsResponse,
  ActiveThemeResponse
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
  getThemeById(id: number): Observable<ThemeDetailsResponse> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.get<ApiResponse<ThemeDetailsResponse> | ThemeDetailsResponse>(`${this.baseUrl}Themes/get`, { params })
      .pipe(
        map(response => (response as ApiResponse<ThemeDetailsResponse>)?.data ?? response as ThemeDetailsResponse),
        catchError(this.handleError)
      );
  }

  /**
   * Get active theme palettes
   * GET /api/Themes/get/active
   */
  getActiveTheme(): Observable<ActiveThemeResponse> {
    return this.http.get<ApiResponse<ActiveThemeResponse> | ActiveThemeResponse>(`${this.baseUrl}Themes/get/active`)
      .pipe(
        map(response => (response as ApiResponse<ActiveThemeResponse>)?.data ?? response as ActiveThemeResponse),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new Theme
   * POST /api/Themes/create
   */
  createTheme(request: CreateThemeRequest): Observable<ThemeDetailsResponse> {
    return this.http.post<ApiResponse<ThemeDetailsResponse> | ThemeDetailsResponse>(`${this.baseUrl}Themes/create`, request)
      .pipe(
        map(response => (response as ApiResponse<ThemeDetailsResponse>)?.data ?? response as ThemeDetailsResponse),
        catchError(this.handleError)
      );
  }

  /**
   * Edit existing Theme
   * PUT /api/Themes/edit
   */
  editTheme(request: EditThemeRequest): Observable<ThemeDetailsResponse> {
    return this.http.put<ApiResponse<ThemeDetailsResponse> | ThemeDetailsResponse>(`${this.baseUrl}Themes/edit`, request)
      .pipe(
        map(response => (response as ApiResponse<ThemeDetailsResponse>)?.data ?? response as ThemeDetailsResponse),
        catchError(this.handleError)
      );
  }

  /**
   * Delete Theme by ID
   * DELETE /api/Themes/delete?Id=20
   */
  deleteTheme(id: number): Observable<boolean> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.delete<ApiResponse<boolean> | { success: boolean }>(`${this.baseUrl}Themes/delete`, { params })
      .pipe(
        map(response => (response as ApiResponse<boolean>)?.success ?? (response as { success: boolean })?.success ?? false),
        catchError(this.handleError)
      );
  }

  /**
   * Set theme active/inactive status
   * PUT /api/Themes/set/active
   */
  setActiveStatus(request: SetActiveRequest): Observable<boolean> {
    return this.http.put<ApiResponse<boolean> | { success: boolean }>(`${this.baseUrl}Themes/set/active`, request)
      .pipe(
        map(response => (response as ApiResponse<boolean>)?.success ?? (response as { success: boolean })?.success ?? false),
        catchError(this.handleError)
      );
  }

  /**
   * Set theme as default
   * PUT /api/Themes/set/default
   */
  setDefaultTheme(request: SetDefaultRequest): Observable<boolean> {
    return this.http.put<ApiResponse<boolean> | { success: boolean }>(`${this.baseUrl}Themes/set/default`, request)
      .pipe(
        map(response => (response as ApiResponse<boolean>)?.success ?? (response as { success: boolean })?.success ?? false),
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
