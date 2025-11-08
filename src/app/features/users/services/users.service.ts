import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  AdminUser,
  AdminUserDetails, 
  UsersListRequest, 
  UsersListResponse, 
  ApiResponse,
  BanUserRequest,
  PremiumUserRequest
} from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get paginated list of admin users with optional filters
   * GET /api/AdminUsers/list?CityId=2&Filter=1&PageSize=10&CurrentPage=1
   */
  getUsersList(request: UsersListRequest): Observable<UsersListResponse> {
    let params = new HttpParams()
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    if (request.cityId !== undefined && request.cityId !== null) {
      params = params.set('CityId', request.cityId.toString());
      console.log('Setting CityId param:', request.cityId);
    }

    if (request.filter !== undefined && request.filter !== null) {
      params = params.set('Filter', request.filter.toString());
      console.log('Setting Filter param:', request.filter);
    }

    if (request.searchKeyword && request.searchKeyword.trim()) {
      params = params.set('SearchKeyword', request.searchKeyword.trim());
      console.log('Setting SearchKeyword param:', request.searchKeyword);
    }

    console.log('API Request:', {
      url: `${this.baseUrl}AdminUsers/list`,
      params: params.toString(),
      paramsObject: {
        PageSize: request.pageSize,
        CurrentPage: request.currentPage,
        CityId: request.cityId,
        Filter: request.filter,
        SearchKeyword: request.searchKeyword
      }
    });

    return this.http.get<any>(`${this.baseUrl}AdminUsers/list`, { params })
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
   * Get single user details by ID
   * GET /api/AdminUsers/details?UserId={id}
   */
  getUserDetails(userId: string): Observable<AdminUserDetails> {
    const params = new HttpParams().set('UserId', userId);
    
    return this.http.get<any>(`${this.baseUrl}AdminUsers/details`, { params })
      .pipe(
        map(response => {
          console.log('API Response for user details:', response);
          return response.data || response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Ban or unban user
   * POST /api/AdminUsers/ban
   */
  banUser(request: BanUserRequest): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}AdminUsers/ban`, request)
      .pipe(
        map(response => response.success),
        catchError(this.handleError)
      );
  }

  /**
   * Set or remove premium status
   * POST /api/AdminUsers/premium
   */
  setPremiumStatus(request: PremiumUserRequest): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}AdminUsers/premium`, request)
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

    console.error('Users Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
