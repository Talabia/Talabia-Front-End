import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { FloatLabelModule } from 'primeng/floatlabel';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    ToastModule,
    TranslatePipe,
    FloatLabelModule,
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  emailOrPhone: string = '';
  loading: boolean = false;
  returnUrl: string = '/';

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
          queryParams: {
            userId: response.userId,
            identifier: this.emailOrPhone,
            returnUrl: this.returnUrl,
          },
        });
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.languageService.translate('auth.error.sendFailed'),
        });
      },
    });
  }
}
