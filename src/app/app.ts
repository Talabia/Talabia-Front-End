import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PrimeNG } from 'primeng/config';
import { HeaderComponent } from './layout/header/header.component';
import { SideBarComponent } from './layout/side-bar/side-bar.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, SideBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('talabia-admin');
  constructor(private primeng: PrimeNG) {}

  // Sidebar states
  sidebarState = 'open'; // 'open', 'collapsed', 'hidden'
  collapsed = false; // for desktop collapse
  hidden = false; // for desktop hidden
  collapsedOnMobile = true; // for mobile toggle

  ngOnInit() {
    this.primeng.ripple.set(true);

    // Load saved sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarState');
    if (savedState) {
      this.sidebarState = savedState;
      this.applyStateFromSaved();
    }
  }

  toggleSidebar() {
    if (this.isMobile()) {
      this.collapsedOnMobile = !this.collapsedOnMobile;
    } else {
      // Toggle between open and collapsed on desktop
      if (this.sidebarState === 'open') {
        this.sidebarState = 'collapsed';
        this.collapsed = true;
        this.hidden = false;
      } else if (this.sidebarState === 'collapsed') {
        this.sidebarState = 'open';
        this.collapsed = false;
        this.hidden = false;
      } else if (this.sidebarState === 'hidden') {
        this.sidebarState = 'open';
        this.collapsed = false;
        this.hidden = false;
      }

      // Save state to localStorage
      localStorage.setItem('sidebarState', this.sidebarState);
    }
  }

  toggleHideSidebar() {
    if (this.sidebarState === 'hidden') {
      this.sidebarState = 'open';
      this.hidden = false;
      this.collapsed = false;
    } else {
      this.sidebarState = 'hidden';
      this.hidden = true;
      this.collapsed = false;
    }

    // Save state to localStorage
    localStorage.setItem('sidebarState', this.sidebarState);
  }

  private applyStateFromSaved(): void {
    switch (this.sidebarState) {
      case 'open':
        this.collapsed = false;
        this.hidden = false;
        break;
      case 'collapsed':
        this.collapsed = true;
        this.hidden = false;
        break;
      case 'hidden':
        this.collapsed = false;
        this.hidden = true;
        break;
    }
  }

  isMobile() {
    return window.innerWidth <= 768;
  }
}
