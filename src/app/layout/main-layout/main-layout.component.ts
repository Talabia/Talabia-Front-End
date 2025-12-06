import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { SideBarComponent } from '../side-bar/side-bar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, SideBarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  sidebarState: 'open' | 'hidden' = 'open';

  constructor() {}

  ngOnInit() {
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
