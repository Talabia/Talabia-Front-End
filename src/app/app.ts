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
  sidebarState: 'open' | 'hidden' = 'open';

  constructor(private primeng: PrimeNG) {}

  ngOnInit() {
    this.primeng.ripple.set(true);
    const savedState = localStorage.getItem('sidebarState') as 'open' | 'hidden' | null;
    if (savedState) {
      this.sidebarState = savedState;
    }
  }

  toggleHideSidebar() {
    this.sidebarState = this.sidebarState === 'hidden' ? 'open' : 'hidden';
    localStorage.setItem('sidebarState', this.sidebarState);
  }

  get hidden() {
    return this.sidebarState === 'hidden';
  }
}
