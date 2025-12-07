import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoaderState {
  isVisible: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalLoaderService {
  private loaderState$ = new BehaviorSubject<LoaderState>({
    isVisible: false,
    message: 'common.loading'
  });

  constructor() { }

  /**
   * Get the current loader state as an observable
   */
  getLoaderState(): Observable<LoaderState> {
    return this.loaderState$.asObservable();
  }

  /**
   * Show the global loader with an optional message
   * @param message Translation key for the loading message (defaults to 'common.loading')
   */
  show(message: string = 'common.loading'): void {
    this.loaderState$.next({
      isVisible: true,
      message
    });
  }

  /**
   * Hide the global loader
   */
  hide(): void {
    this.loaderState$.next({
      isVisible: false,
      message: 'common.loading'
    });
  }

  /**
   * Get the current loader state value (synchronous)
   */
  getCurrentState(): LoaderState {
    return this.loaderState$.value;
  }

  /**
   * Check if loader is currently visible
   */
  isVisible(): boolean {
    return this.loaderState$.value.isVisible;
  }
}
