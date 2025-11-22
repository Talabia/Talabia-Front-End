import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { LanguageService } from '../services/language.service';

/**
 * Guard that validates the language parameter in the URL
 * and sets the application language accordingly
 */
export const languageGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const languageService = inject(LanguageService);
  const router = inject(Router);
  
  const langParam = route.params['lang'];
  
  // Check if the language parameter is valid
  if (langParam === 'en' || langParam === 'ar') {
    // Set the language in the service
    languageService.setLanguage(langParam);
    return true;
  } else {
    // Invalid language, redirect to default language with the same path
    const currentPath = route.url.map(segment => segment.path).join('/');
    const defaultLang = languageService.getCurrentLanguage();
    
    if (currentPath) {
      router.navigate([`/${defaultLang}/${currentPath}`]);
    } else {
      router.navigate([`/${defaultLang}`]);
    }
    
    return false;
  }
};
