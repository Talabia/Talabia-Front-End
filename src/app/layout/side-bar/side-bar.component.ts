import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem, MessageService } from 'primeng/api';
import { PanelMenu } from 'primeng/panelmenu';
import { LanguageService } from '../../shared/services/language.service';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [PanelMenuModule, CommonModule, PanelMenu],
  providers: [MessageService],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBarComponent implements OnInit, OnDestroy {
  @Input() hidden: boolean | undefined;

  menuItems: MenuItem[] = [];
  items: MenuItem[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(private languageService: LanguageService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.buildMenu();
    this.languageService.languageChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.buildMenu();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildMenu(): void {
    this.menuItems = [
      {
        label: this.t('sidebar.advertisement'),
        icon: 'pi pi-bullseye',
        routerLink: ['/advertisement/advertisement-management'],
      },
      {
        label: this.t('sidebar.theme'),
        icon: 'pi pi-palette',
        routerLink: ['/application-theme/theme-management'],
      },
      {
        label: this.t('sidebar.customerSupport'),
        icon: 'pi pi-megaphone',
        routerLink: ['/customer-support/customer-support-mangement'],
      },
    ];

    this.items = [
      {
        label: this.t('sidebar.lookups'),
        icon: 'pi pi-book',
        items: [
          {
            label: this.t('lookups.cities'),
            icon: 'pi pi-file',
            routerLink: '/looksup/cities',
          },
          // {
          //   label: this.t('lookups.conditions'),
          //   icon: 'pi pi-file',
          //   routerLink: '/looksup/conditions',
          // },
          {
            label: this.t('lookups.sparePartsStatus'),
            icon: 'pi pi-file',
            routerLink: '/looksup/spare-parts-status',
          },
          {
            label: this.t('lookups.vehicleTypes'),
            icon: 'pi pi-file',
            routerLink: '/looksup/vehicle-types',
          },
          {
            label: this.t('lookups.vehicleMakers'),
            icon: 'pi pi-file',
            routerLink: '/looksup/vehicle-makers',
          },
          {
            label: this.t('lookups.vehicleModels'),
            icon: 'pi pi-file',
            routerLink: '/looksup/vehicle-models',
          },
        ],
      },
      {
        label: this.t('sidebar.users'),
        icon: 'pi pi-users',
        items: [
          {
            label: this.t('users.management'),
            icon: 'pi pi-user',
            routerLink: '/users/user-management',
          },
          {
            label: this.t('users.verifications'),
            icon: 'pi pi-verified',
            routerLink: '/users/user-verifications',
          },
        ],
      },
      {
        label: this.t('sidebar.analytics'),
        icon: 'pi pi-chart-bar',
        items: [
          {
            label: this.t('sidebar.dashboard'),
            icon: 'pi pi-chart-line',
            routerLink: '/analytics-statistics/dashboard',
          },
          {
            label: this.t('sidebar.verificationsStatistics'),
            icon: 'pi pi-chart-line',
            routerLink: '/analytics-statistics/verifications-statistics',
          },
        ],
      },
      {
        label: this.t('sidebar.reports'),
        icon: 'pi pi-flag',
        items: [
          {
            label: this.t('sidebar.reportsManagement'),
            icon: 'pi pi-file',
            routerLink: '/reports/reports-mangement',
          },
        ],
      },
    ];

    this.cdr.markForCheck();
  }

  private t(key: string): string {
    return this.languageService.translate(key);
  }
}
