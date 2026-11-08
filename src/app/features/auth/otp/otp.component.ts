import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import {
  LOGIN_ERROR_STATE_KEY,
  apiErrorMessage,
  isDashboardAccessDenied,
} from '../../../core/auth/auth-errors';
import { digitsOnly, isNonDigitCharacterKey } from '../../../shared/utils/digits.util';
@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ToastModule,
    TranslatePipe,
    CardModule,
    InputTextModule,
    RouterLink,
  ],
  providers: [MessageService],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
})
export class OtpComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly otpLength = 6;
  /** One digit per box; boxes are always laid out left-to-right (see template `dir="ltr"`). */
  digits: string[] = Array(this.otpLength).fill('');
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

  @ViewChildren('otpBox', { read: ElementRef }) private otpBoxes?: QueryList<ElementRef<HTMLInputElement>>;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.userId = params['userId'];
      this.identifier = params['identifier'];
      this.returnUrl = params['returnUrl'] || '/';

      if (!this.userId) {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    });

    this.startTimer();
  }

  ngAfterViewInit() {
    this.focusBox(0);
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

  // ---- OTP boxes: digits only, one digit per box, filled left to right ----

  onDigitKeydown(index: number, event: KeyboardEvent) {
    switch (event.key) {
      case 'Backspace':
        event.preventDefault();
        if (this.digits[index]) {
          this.setDigit(index, '');
        } else if (index > 0) {
          this.setDigit(index - 1, '');
          this.focusBox(index - 1);
        }
        return;
      case 'Delete':
        event.preventDefault();
        this.setDigit(index, '');
        return;
      case 'ArrowLeft':
        event.preventDefault();
        this.focusBox(index - 1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.focusBox(index + 1);
        return;
    }

    if (isNonDigitCharacterKey(event)) {
      event.preventDefault();
      return;
    }

    const digit = digitsOnly(event.key);
    if (digit.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Replace whatever is in the box with exactly this digit, then advance to the right.
      event.preventDefault();
      this.setDigit(index, digit);
      this.focusBox(index + 1);
    }
  }

  /** Fallback for mobile keyboards / IME / SMS autofill, where keydown can't be relied on. */
  onDigitInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const clean = digitsOnly(input.value);
    if (clean.length > 1) {
      this.fillFrom(index, clean);
      return;
    }
    input.value = clean;
    this.setDigit(index, clean);
    if (clean) {
      this.focusBox(index + 1);
    }
  }

  onDigitPaste(index: number, event: ClipboardEvent) {
    event.preventDefault();
    const clean = digitsOnly(event.clipboardData?.getData('text') ?? '');
    if (clean) {
      this.fillFrom(index, clean);
    }
  }

  onDigitFocus(event: FocusEvent) {
    (event.target as HTMLInputElement).select();
  }

  private fillFrom(start: number, value: string) {
    // A full-length code (e.g. pasted/autofilled) always starts at the first box.
    const from = value.length >= this.otpLength ? 0 : start;
    const chars = value.slice(0, this.otpLength - from).split('');
    chars.forEach((d, i) => (this.digits[from + i] = d));
    this.syncBoxes();
    this.focusBox(Math.min(from + chars.length, this.otpLength - 1));
    this.updateOtp();
  }

  private setDigit(index: number, digit: string) {
    this.digits[index] = digit;
    this.syncBoxes();
    this.updateOtp();
  }

  private syncBoxes() {
    this.otpBoxes?.forEach((box, i) => {
      if (box.nativeElement.value !== this.digits[i]) {
        box.nativeElement.value = this.digits[i];
      }
    });
  }

  private focusBox(index: number) {
    const box = this.otpBoxes?.get(index)?.nativeElement;
    if (box) {
      box.focus();
      box.select();
    }
  }

  private updateOtp() {
    this.otp = this.digits.join('');
    this.cd.markForCheck();
    if (this.otp.length === this.otpLength) {
      this.onVerify();
    }
  }

  onVerify() {
    if (this.loading || !this.otp || this.otp.length < this.otpLength) {
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
          this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
        }, 500);
      },
      error: (err) => {
        this.loading = false;
        if (isDashboardAccessDenied(err)) {
          // Nothing was stored by AuthService; send the user back to the phone step with the reason.
          this.stopTimer();
          const message = apiErrorMessage(
            err,
            this.languageService.translate('auth.error.notAuthorized')
          );
          this.router.navigate(['/login'], {
            replaceUrl: true,
            queryParams: this.returnUrl !== '/' ? { returnUrl: this.returnUrl } : {},
            state: { [LOGIN_ERROR_STATE_KEY]: message },
          });
          return;
        }
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
