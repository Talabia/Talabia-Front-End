import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  VehicleMaker, 
  CreateVehicleMakerRequest, 
  EditVehicleMakerRequest, 
  VehicleMakersListRequest, 
  VehicleMakersListResponse, 
  ApiResponse,
  DeleteVehicleMakerRequest,
  ImageUploadRequest,
  ImageUploadResponse
} from '../models/vehicle-makers.models';

@Injectable({
  providedIn: 'root'
})
export class VehicleMakersService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of vehicle makers with optional search
   * GET /api/VehicleMakers/list?SearchKeyword=dd&PageSize=10&CurrentPage=1
   */
  getVehicleMakersList(request: VehicleMakersListRequest): Observable<VehicleMakersListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    return this.http.get<any>(`${this.baseUrl}VehicleMakers/list`, { params })
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
   * Get single vehicle maker by ID
   * GET /api/VehicleMakers/get?Id=0
   */
  getVehicleMakerById(id: number): Observable<VehicleMaker> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.get<ApiResponse<VehicleMaker>>(`${this.baseUrl}VehicleMakers/get`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new vehicle maker
   * POST /api/VehicleMakers/create
   */
  createVehicleMaker(request: CreateVehicleMakerRequest): Observable<VehicleMaker> {
    return this.http.post<ApiResponse<VehicleMaker>>(`${this.baseUrl}VehicleMakers/create`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Edit existing vehicle maker
   * PUT /api/VehicleMakers/edit
   */
  editVehicleMaker(request: EditVehicleMakerRequest): Observable<VehicleMaker> {
    return this.http.put<ApiResponse<VehicleMaker>>(`${this.baseUrl}VehicleMakers/edit`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Delete vehicle maker by ID
   * DELETE /api/VehicleMakers/delete?Id=0
   */
  deleteVehicleMaker(id: number): Observable<boolean> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}VehicleMakers/delete`, { params })
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
   * Get vehicle makers lookup (simplified list)
   * GET /api/Lookups/vehicle/makers
   */
  getVehicleMakersLookup(): Observable<VehicleMaker[]> {
    return this.http.get<any>(`${this.baseUrl}Lookups/vehicle/makers`)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          return response || [];
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

    console.error('Vehicle Makers Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
