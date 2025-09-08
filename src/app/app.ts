import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNG } from 'primeng/config';
import { HeaderComponent } from './layout/header/header.component';
import { SideBarComponent } from './layout/side-bar/side-bar.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, SideBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('talabia-admin');
  constructor(private primeng: PrimeNG) {}
  collapsed = false; // for desktop collapse
  collapsedOnMobile = true; // for mobile toggle

  ngOnInit() {
    this.primeng.ripple.set(true);
  }
  toggleSidebar() {
    if (this.isMobile()) {
      this.collapsedOnMobile = !this.collapsedOnMobile;
    } else {
      this.collapsed = !this.collapsed;
    }
  }

  isMobile() {
    return window.innerWidth <= 768;
  }
}
