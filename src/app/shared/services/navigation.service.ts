import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from './language.service';

/**
 * Navigation service that handles language-aware routing
 * Automatically includes the current language prefix in all navigation calls
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private router = inject(Router);
  private languageService = inject(LanguageService);

  /**
   * Navigate to a route with the current language prefix
   * @param path - The path without language prefix (e.g., '/users/user-management')
   * @param extras - Optional navigation extras
   */
  navigate(path: string | string[], extras?: any): Promise<boolean> {
    const currentLang = this.languageService.getCurrentLanguage();
    
    if (Array.isArray(path)) {
      const fullPath = [`/${currentLang}`, ...path];
      return this.router.navigate(fullPath, extras);
    } else {
      // Remove leading slash if present to avoid double slashes
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const fullPath = `/${currentLang}/${cleanPath}`;
      return this.router.navigateByUrl(fullPath, extras);
    }
  }

  /**
   * Navigate by URL with the current language prefix
   * @param url - The URL without language prefix
   * @param extras - Optional navigation extras
   */
  navigateByUrl(url: string, extras?: any): Promise<boolean> {
    const currentLang = this.languageService.getCurrentLanguage();
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const fullUrl = `/${currentLang}/${cleanUrl}`;
    return this.router.navigateByUrl(fullUrl, extras);
  }

  /**
   * Get the current route path without the language prefix
   */
  getCurrentPathWithoutLanguage(): string {
    const currentUrl = this.router.url;
    return currentUrl.replace(/^\/(ar|en)/, '') || '/';
  }

  /**
   * Get a language-aware router link for templates
   * @param path - The path without language prefix
   */
  getRouterLink(path: string): string {
    const currentLang = this.languageService.getCurrentLanguage();
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `/${currentLang}/${cleanPath}`;
  }
}
