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
}
