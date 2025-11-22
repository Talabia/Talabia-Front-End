import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

/**
 * HTTP Interceptor that adds the Accepted-Language header to all outgoing requests
 * based on the current language setting from the LanguageService
 */
export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const languageService = inject(LanguageService);
  const currentLang = languageService.getCurrentLanguage();
  
  // Clone the request and add the Accepted-Language header
  const modifiedReq = req.clone({
    setHeaders: {
      'Accept-Language': currentLang
    }
  });

  return next(modifiedReq);
};
