import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Base URL of the backend API for the current build configuration.
 * Services concatenate endpoint names directly (e.g. `${base}Auth`), so the value
 * is normalised to always end with a single trailing slash.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl.replace(/\/*$/, '/'),
});
