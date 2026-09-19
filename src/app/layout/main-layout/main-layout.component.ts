import { Component, HostListener, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, filter, takeUntil } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { GlobalLoaderComponent } from '../../shared/components/global-loader/global-loader';

const OVERLAY_MEDIA_QUERY = '(max-width: 1024px)';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, SideBarComponent, GlobalLoaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  sidebarState = signal<'open' | 'hidden'>('open');
  mobileSidebarOpen = signal(false);
  isOverlayMode = signal(false);

  hidden = computed(() =>
    this.isOverlayMode() ? !this.mobileSidebarOpen() : this.sidebarState() === 'hidden'
  );
  showBackdrop = computed(() => this.isOverlayMode() && this.mobileSidebarOpen());

  private readonly destroy$ = new Subject<void>();
  private mediaQueryList?: MediaQueryList;
  private readonly onMediaQueryChange = (event: MediaQueryListEvent) => {
    this.isOverlayMode.set(event.matches);
  };

  constructor(private router: Router) {}

  ngOnInit() {
    const savedState = localStorage.getItem('sidebarState') as 'open' | 'hidden' | null;
    if (savedState) {
      this.sidebarState.set(savedState);
    }

    this.mediaQueryList = window.matchMedia(OVERLAY_MEDIA_QUERY);
    this.isOverlayMode.set(this.mediaQueryList.matches);
    this.mediaQueryList.addEventListener('change', this.onMediaQueryChange);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.closeMobileSidebar());
  }

  ngOnDestroy(): void {
    this.mediaQueryList?.removeEventListener('change', this.onMediaQueryChange);
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.closeMobileSidebar();
  }

  toggleHideSidebar() {
    if (this.isOverlayMode()) {
      this.mobileSidebarOpen.update((open) => !open);
      return;
    }
    const next = this.sidebarState() === 'hidden' ? 'open' : 'hidden';
    this.sidebarState.set(next);
    localStorage.setItem('sidebarState', next);
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen.set(false);
  }
}
