import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';
import { SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
@Component({
  selector: 'app-header',
  imports: [Toolbar, AvatarModule, ButtonModule, TooltipModule],
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  @Output() toggleHideSidebar = new EventEmitter<void>();
  darkModeBtn: boolean = false;
  hideSideBarBtn: boolean = false;
  currentLang: 'ar' | 'en' = 'ar';

  ngOnInit() {
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedSideBar = localStorage.getItem('hideSideBar');
    const savedLang = localStorage.getItem('lang');
    if (savedDarkMode) {
      this.darkModeBtn = savedDarkMode === 'true';
      this.applyTheme();
    }
    if (savedSideBar) {
      this.hideSideBarBtn = savedSideBar === 'true';
    }
    if (savedLang === 'en' || savedLang === 'ar') {
      this.currentLang = savedLang;
    }
    this.applyLanguage();
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
    this.currentLang = this.currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', this.currentLang);
    this.applyLanguage();
  }

  private applyLanguage() {
    const htmlEl = document.querySelector('html');
    if (htmlEl) {
      htmlEl.setAttribute('dir', this.currentLang === 'ar' ? 'rtl' : 'ltr');
      htmlEl.setAttribute('lang', this.currentLang);
    }
    document.body.classList.toggle('rtl', this.currentLang === 'ar');
  }
}
