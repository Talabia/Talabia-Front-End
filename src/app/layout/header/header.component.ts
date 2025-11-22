import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../shared/services/language.service';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-header',
  imports: [Toolbar, AvatarModule, ButtonModule, TooltipModule, TranslatePipe],
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

  private readonly destroy$ = new Subject<void>();

  constructor(
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
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
    this.languageService.languageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((newLang) => {
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
}
