import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';
import { SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'app-header',
  imports: [Toolbar, AvatarModule, ButtonModule],
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  darkModeBtn: boolean = false;

  ngOnInit() {
    // Load user preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      this.darkModeBtn = savedDarkMode === 'true';
      // Apply saved theme on initialization
      this.applyTheme();
    }
  }

  toggleDarkMode() {
    this.darkModeBtn = !this.darkModeBtn;
    // Save user preference to localStorage
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

  onToggleClick() {
    this.toggleSidebar.emit();
  }
}
