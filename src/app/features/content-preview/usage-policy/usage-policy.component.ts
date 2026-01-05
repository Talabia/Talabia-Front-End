import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../shared/services/language.service';
import { ContentService } from '../services/content.service';

@Component({
  selector: 'app-usage-policy',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    MessageModule,
    ToastModule,
    TranslatePipe,
  ],
  providers: [MessageService],
  templateUrl: './usage-policy.component.html',
  styleUrl: './usage-policy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsagePolicyComponent implements OnInit, OnDestroy {
  htmlContent: SafeHtml | null = null;
  loading: boolean = false;
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private contentService: ContentService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadContent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load usage policy content from API
   */
  loadContent(): void {
    this.loading = true;
    this.errorMessage = null;
    this.htmlContent = null;

    this.contentService
      .getUsagePolicy()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (html: string) => {
          this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(html);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading usage policy:', error);
          this.loading = false;
          this.errorMessage = this.t('usagePolicy.loadError');
          this.messageService.add({
            severity: 'error',
            summary: this.t('common.error'),
            detail: error.message || this.t('usagePolicy.loadError'),
            life: 5000,
          });
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Retry loading content
   */
  retry(): void {
    this.loadContent();
  }

  private t(key: string): string {
    return this.languageService.translate(key);
  }
}
