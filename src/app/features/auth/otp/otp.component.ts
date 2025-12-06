import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputOtpModule } from 'primeng/inputotp';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { CardModule } from 'primeng/card';
@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputOtpModule,
    ButtonModule,
    ToastModule,
    TranslatePipe,
    CardModule,
  ],
  providers: [MessageService],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
})
export class OtpComponent implements OnInit, OnDestroy {
  otp: string = '';
  userId: string = '';
  identifier: string = '';
  loading: boolean = false;
  returnUrl: string = '/';

  // Timer related
  timerPayload: number = 300; // 5 minutes
  timerDisplay: string = '05:00';
  intervalId: any;
  canResend: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private languageService = inject(LanguageService);
  private cd = inject(ChangeDetectorRef);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.userId = params['userId'];
      this.identifier = params['identifier'];
      this.returnUrl = params['returnUrl'] || '/';

      if (!this.userId) {
        this.router.navigate(['/login']);
      }
    });

    this.startTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer() {
    this.canResend = false;
    this.timerPayload = 300;
    this.stopTimer(); // ensure no duplicates
    this.intervalId = setInterval(() => {
      this.timerPayload--;
      const minutes = Math.floor(this.timerPayload / 60);
      const seconds = this.timerPayload % 60;
      this.timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;

      if (this.timerPayload <= 0) {
        this.stopTimer();
        this.canResend = true;
      }
      this.cd.markForCheck();
    }, 1000);
  }

  stopTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onVerify() {
    if (!this.otp || this.otp.length < 6) {
      return;
    }

    this.loading = true;
    this.authService.login(this.userId, this.otp).subscribe({
      next: (user) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Logged in successfully',
        });
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 500);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.languageService.translate('auth.error.invalidOtp'),
        });
      },
    });
  }

  onResend() {
    if (!this.canResend) return;

    this.loading = true;
    this.authService.resendOtp(this.userId).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Sent',
          detail: 'OTP Resent',
        });
        this.startTimer();
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
