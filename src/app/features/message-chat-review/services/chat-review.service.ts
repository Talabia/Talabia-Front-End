import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Chat,
  ChatsListRequest,
  ChatsListResponse,
  LastMessage,
  MessagesRequest,
  MessagesResponse,
  ApiResponse,
} from '../models/chat-review.models';

@Injectable({
  providedIn: 'root',
})
export class ChatReviewService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of chats with time filter
   * GET /api/AdminChats/list?TimeFilter=0&PageSize=10&CurrentPage=1
   */
  getChatsList(request: ChatsListRequest): Observable<ChatsListResponse> {
    let params = new HttpParams()
      .set('TimeFilter', request.timeFilter.toString())
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    return this.http.get<any>(`${this.baseUrl}AdminChats/list`, { params }).pipe(
      map((response) => {
        if (response && response.data) {
          return {
            data: response.data || [],
            totalCount: response.totalCount || 0,
            pageSize: response.pageSize || request.pageSize,
            currentPage: response.currentPage || request.currentPage,
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
   * Get messages for a specific chat
   * GET /api/AdminChats/messages?ChatId={chatId}&PageSize=10&CurrentPage=1
   */
  getChatMessages(request: MessagesRequest): Observable<MessagesResponse> {
    let params = new HttpParams()
      .set('ChatId', request.chatId)
      .set('PageSize', request.pageSize.toString())
      .set('CurrentPage', request.currentPage.toString());

    return this.http.get<any>(`${this.baseUrl}AdminChats/messages`, { params }).pipe(
      map((response) => {
        if (response && response.data) {
          return {
            data: response.data || [],
            totalCount: response.totalCount || 0,
            pageSize: response.pageSize || request.pageSize,
            currentPage: response.currentPage || request.currentPage,
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
   * Centralized error handling
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
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

    console.error('Chat Review Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
