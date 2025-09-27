import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  VehicleType, 
  CreateVehicleTypeRequest, 
  EditVehicleTypeRequest, 
  VehicleTypesListRequest, 
  VehicleTypesListResponse, 
  ApiResponse,
  DeleteVehicleTypeRequest 
} from '../models/vehicle-types.models';

@Injectable({
  providedIn: 'root'
})
export class VehicleTypesService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of vehicle types with optional search
   * GET /api/VehicleTypes/list?SearchKeyword=ff&PageSize=10&CurrentPage=1
   */
  getVehicleTypesList(request: VehicleTypesListRequest): Observable<VehicleTypesListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    return this.http.get<any>(`${this.baseUrl}VehicleTypes/list`, { params })
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
   * Get single vehicle type by ID
   * GET /api/VehicleTypes/get?Id=0
   */
  getVehicleTypeById(id: number): Observable<VehicleType> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.get<ApiResponse<VehicleType>>(`${this.baseUrl}VehicleTypes/get`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new vehicle type
   * POST /api/VehicleTypes/create
   */
  createVehicleType(request: CreateVehicleTypeRequest): Observable<VehicleType> {
    return this.http.post<ApiResponse<VehicleType>>(`${this.baseUrl}VehicleTypes/create`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Edit existing vehicle type
   * PUT /api/VehicleTypes/edit
   */
  editVehicleType(request: EditVehicleTypeRequest): Observable<VehicleType> {
    return this.http.put<ApiResponse<VehicleType>>(`${this.baseUrl}VehicleTypes/edit`, request)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Delete vehicle type by ID
   * DELETE /api/VehicleTypes/delete?Id=0
   */
  deleteVehicleType(id: number): Observable<boolean> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}VehicleTypes/delete`, { params })
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

    console.error('Vehicle Types Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
