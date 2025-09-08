import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
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
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  toggleDarkMode() {
    const element = document.querySelector('html');
    if (element) {
      element.classList.toggle('my-app-dark');
    }
  }

  onToggleClick() {
    this.toggleSidebar.emit();
  }
}
