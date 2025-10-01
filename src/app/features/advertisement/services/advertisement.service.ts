import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  Advertisement, 
  CreateAdvertisementRequest, 
  EditAdvertisementRequest, 
  AdvertisementsListRequest, 
  AdvertisementsListResponse, 
  ApiResponse,
  DeleteAdvertisementRequest,
  ImageUploadRequest,
  ImageUploadResponse
} from '../models/advertisement.models';

@Injectable({
  providedIn: 'root'
})
export class AdvertisementService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of advertisements with optional search and status filter
   * GET /api/Advertisements/list?IsActive=true&SearchKeyword=ff&PageSize=10&CurrentPage=1
   */
  getAdvertisementsList(request: AdvertisementsListRequest): Observable<AdvertisementsListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.isActive !== undefined && request.isActive !== null) {
      params = params.set('IsActive', request.isActive.toString());
    }

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    return this.http.get<any>(`${this.baseUrl}Advertisements/list`, { params })
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
   * Get single advertisement by ID
   * GET /api/Advertisements/get?Id=3fa85f64-5717-4562-b3fc-2c963f66afa6
   */
  getAdvertisementById(id: string): Observable<Advertisement> {
    const params = new HttpParams().set('Id', id);
    
    return this.http.get<ApiResponse<Advertisement>>(`${this.baseUrl}Advertisements/get`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new advertisement
   * POST /api/Advertisements/create
   */
  createAdvertisement(request: CreateAdvertisementRequest): Observable<Advertisement> {
    return this.http.post<ApiResponse<Advertisement>>(`${this.baseUrl}Advertisements/create`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Edit existing advertisement
   * PUT /api/Advertisements/edit
   */
  editAdvertisement(request: EditAdvertisementRequest): Observable<Advertisement> {
    return this.http.put<ApiResponse<Advertisement>>(`${this.baseUrl}Advertisements/edit`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Delete advertisement by ID
   * DELETE /api/Advertisements/delete?Id=3fa85f64-5717-4562-b3fc-2c963f66afa6
   */
  deleteAdvertisement(id: string): Observable<boolean> {
    const params = new HttpParams().set('Id', id);
    
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}Advertisements/delete`, { params })
      .pipe(
        map(response => response.success),
        catchError(this.handleError)
      );
  }

  /**
   * Upload image
   * POST /api/Uploaders/image
   */
  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('filePath', file);

    // Try to get authentication token from localStorage or sessionStorage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || 
                  localStorage.getItem('token') || sessionStorage.getItem('token') ||
                  localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post<any>(`${this.baseUrl}Uploaders/image`, formData, { headers })
      .pipe(
        map(response => {
          // Return the URL from the response
          if (response && response.data && response.data.url) {
            return response.data.url;
          }
          // Fallback if response structure is different
          return response.url || response.data || response;
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

    console.error('Advertisement Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
