import { Component, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';
import {
  LOGIN_ERROR_STATE_KEY,
  apiErrorMessage,
  isDashboardAccessDenied,
} from '../../../core/auth/auth-errors';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ToastModule,
    TranslatePipe,
    PhoneInputComponent,
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  emailOrPhone: string = '';
  loading: boolean = false;
  returnUrl: string = '/';
  /** Persistent inline error (e.g. account not authorized for the dashboard). */
  authError = signal<string | null>(null);

  @ViewChild('phoneField') phoneField?: NgModel;

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // Add ActivatedRoute
  private messageService = inject(MessageService);
  private languageService = inject(LanguageService); // Inject for manual translation if needed, or use pipe in template

  constructor() {
    // In standalone, we can inject in property or constructor.
    // Using constructor for route subscription if needed, or just reading snapshot.
    this.route.queryParams.subscribe((params) => {
      this.returnUrl = params['returnUrl'] || '/';
    });

    // Access-denied message handed back from the OTP step (403 / role check on verify).
    const stateError = this.router.currentNavigation()?.extras.state?.[LOGIN_ERROR_STATE_KEY];
    if (typeof stateError === 'string' && stateError) {
      this.authError.set(stateError);
    }
  }

  onSendOtp() {
    if (!this.emailOrPhone) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: this.languageService.translate('auth.validation.required'),
      });
      return;
    }

    if (this.phoneField?.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: this.languageService.translate('auth.validation.invalidPhone'),
      });
      return;
    }

    this.authError.set(null);
    this.loading = true;
    this.authService.sendOtp(this.emailOrPhone).subscribe({
      next: (response) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'OTP Sent Successfully',
        });
        // Navigate to OTP page, passing data and returnUrl
        this.router.navigate(['/otp'], {
          replaceUrl: true,
          queryParams: {
            userId: response.userId,
            identifier: this.emailOrPhone,
            returnUrl: this.returnUrl,
          },
        });
      },
      error: (err) => {
        this.loading = false;
        if (isDashboardAccessDenied(err)) {
          this.handleAccessDenied(err);
          return;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.languageService.translate('auth.error.sendFailed'),
        });
      },
    });
  }

  /** Non-admin account: show the reason, store nothing, and reset to an empty phone step. */
  private handleAccessDenied(err: unknown) {
    const message = apiErrorMessage(
      err,
      this.languageService.translate('auth.error.notAuthorized')
    );
    this.authError.set(message);
    this.messageService.add({
      severity: 'error',
      summary: this.languageService.translate('auth.error.forbiddenTitle'),
      detail: message,
    });
    this.emailOrPhone = '';
    this.phoneField?.control.markAsPristine();
    this.phoneField?.control.markAsUntouched();
  }
}
