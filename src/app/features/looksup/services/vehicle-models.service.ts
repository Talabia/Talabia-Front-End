import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  VehicleModel, 
  CreateVehicleModelRequest, 
  EditVehicleModelRequest, 
  VehicleModelsListRequest, 
  VehicleModelsListResponse,
  VehicleModelDetailsResponse,
  VehicleMakerLookup
} from '../models/vehicle-models.models';

@Injectable({
  providedIn: 'root'
})
export class VehicleModelsService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of vehicle models with optional search
   * GET /api/VehicleModels/list?SearchKeyword=st&PageSize=10&CurrentPage=1
   */
  getVehicleModelsList(request: VehicleModelsListRequest): Observable<VehicleModelsListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
    }

    return this.http.get<any>(`${this.baseUrl}VehicleModels/list`, { params })
      .pipe(
        map(response => {
          // Handle API response structure
          if (response && response.data) {
            return {
              data: response.data,
              totalCount: response.totalCount || 0,
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
   * Get single vehicle model by ID
   * GET /api/VehicleModels/get?Id=5
   */
  getVehicleModelById(id: number): Observable<VehicleModelDetailsResponse> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.get<any>(`${this.baseUrl}VehicleModels/get`, { params })
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new vehicle model
   * POST /api/VehicleModels/create
   */
  createVehicleModel(request: CreateVehicleModelRequest): Observable<VehicleModel> {
    return this.http.post<any>(`${this.baseUrl}VehicleModels/create`, request)
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  /**
   * Edit existing vehicle model
   * PUT /api/VehicleModels/edit
   */
  editVehicleModel(request: EditVehicleModelRequest): Observable<VehicleModel> {
    return this.http.put<any>(`${this.baseUrl}VehicleModels/edit`, request)
      .pipe(
        map(response => response.data || response),
        catchError(this.handleError)
      );
  }

  /**
   * Delete vehicle model by ID
   * DELETE /api/VehicleModels/delete?Id=5
   */
  deleteVehicleModel(id: number): Observable<boolean> {
    const params = new HttpParams().set('Id', id.toString());
    
    return this.http.delete<any>(`${this.baseUrl}VehicleModels/delete`, { params })
      .pipe(
        map(response => response.success !== false),
        catchError(this.handleError)
      );
  }

  /**
   * Get vehicle makers lookup for dropdown
   * GET /api/Lookups/vehicle/makers
   */
  getVehicleMakersLookup(): Observable<VehicleMakerLookup[]> {
    return this.http.get<VehicleMakerLookup[]>(`${this.baseUrl}Lookups/vehicle/makers`)
      .pipe(
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

    console.error('Vehicle Models Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
