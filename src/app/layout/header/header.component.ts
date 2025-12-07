import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { LanguageService } from '../../shared/services/language.service';
import { GlobalLoaderService } from '../../shared/services/global-loader.service';

@Component({
  selector: 'app-header',
  imports: [Toolbar, AvatarModule, ButtonModule, TooltipModule, TranslatePipe, CommonModule],
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleHideSidebar = new EventEmitter<void>();
  darkModeBtn: boolean = false;
  hideSideBarBtn: boolean = false;
  currentLang: 'ar' | 'en' = 'ar';

  public authService = inject(AuthService); // Public for template use

  private readonly destroy$ = new Subject<void>();

  constructor(
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef,
    private globalLoaderService: GlobalLoaderService
  ) {}

  ngOnInit() {
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedSideBar = localStorage.getItem('hideSideBar');
    if (savedDarkMode) {
      this.darkModeBtn = savedDarkMode === 'true';
      this.applyTheme();
    }
    if (savedSideBar) {
      this.hideSideBarBtn = savedSideBar === 'true';
    }

    // Initialize current language
    this.currentLang = this.languageService.getCurrentLanguage();

    // Subscribe to language changes
    this.languageService.languageChanged$.pipe(takeUntil(this.destroy$)).subscribe((newLang) => {
      this.currentLang = newLang;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDarkMode() {
    this.darkModeBtn = !this.darkModeBtn;
    localStorage.setItem('darkMode', this.darkModeBtn.toString());
    this.applyTheme();
  }

  private applyTheme() {
    const element = document.querySelector('html');
    if (element) {
      if (this.darkModeBtn) {
        element.classList.add('my-app-dark');
      } else {
        element.classList.remove('my-app-dark');
      }
    }
  }
  onToggleHideClick() {
    this.hideSideBarBtn = !this.hideSideBarBtn;
    localStorage.setItem('hideSideBar', this.hideSideBarBtn.toString());
    this.toggleHideSidebar.emit();
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }

  logout() {
    if (this.globalLoaderService.isVisible()) return;

    this.globalLoaderService.show('common.loggingOut');

    this.authService.logout().subscribe({
      next: () => {
        this.globalLoaderService.hide();
      },
      error: () => {
        // If logout API fails, force logout (already handled in service)
        // Just hide the loader as the user will be redirected
        this.globalLoaderService.hide();
        // Force logout to ensure cleanup even if API fails
        this.authService.forceLogout();
      }
    });
  }
}
