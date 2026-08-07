import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../../shared/services/language.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const languageService = inject(LanguageService);

  if (!authService.isLoggedIn()) {
    return true;
  }

  const lang = languageService.getCurrentLanguage();
  return router.createUrlTree([`/${lang}`]);
};
