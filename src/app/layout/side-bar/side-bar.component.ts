import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem, MessageService } from 'primeng/api';
import { PanelMenu } from 'primeng/panelmenu';
import { Router } from '@angular/router';
@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [PanelMenuModule, CommonModule, PanelMenu],
  providers: [MessageService],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBarComponent implements OnInit {
  @Input() hidden: boolean | undefined;

  menuItems = [
    { label: 'advertisement', icon: 'pi pi-bullseye',
      routerLink: ['/advertisement/advertisement-management']
     },
     { label: 'theme', icon: 'pi pi-palette',
      routerLink: ['/application-theme/theme-management']
     } ,
     { label: 'customer support', icon: 'pi pi-megaphone',
      routerLink: ['/customer-support/customer-support-mangement']
     } 
     ];
  items: MenuItem[] | undefined;

  constructor(private router: Router) {}

  ngOnInit() {
    this.items = [
      { 
        label: 'Lookups',
        icon: 'pi pi-book',
        items: [
          {
            label: 'Cities',
            icon: 'pi pi-file',
            routerLink: '/looksup/cities',
          },
          {
            label: 'Conditions',
            icon: 'pi pi-file',
            routerLink: '/looksup/conditions',
          },
          {
            label: 'Spare Parts Status',
            icon: 'pi pi-file',
            routerLink: '/looksup/spare-parts-status',
          },
          {
            label: 'Vehicle Types',
            icon: 'pi pi-file',
            routerLink: '/looksup/vehicle-types',
          },
          {
            label: 'Vehicle Makers',
            icon: 'pi pi-file',
            routerLink: '/looksup/vehicle-makers',
          },
          {
            label: 'Vehicle Models',
            icon: 'pi pi-file',
            routerLink: '/looksup/vehicle-models',
          }
        ],
      },
      { 
        label: 'users',
        icon: 'pi pi-users',
        items: [
          {
            label: 'User Management',
            icon: 'pi pi-user',
            routerLink: '/users/user-management',
          }
        ],
      },
      { 
        label: 'analytics-statistics',
        icon: 'pi pi-chart-bar',
        items: [
          {
            label: 'Dashboard',
            icon: 'pi pi-chart-line',
            routerLink: '/analytics-statistics/dashboard',
          }
        ],
      },
      { 
        label: 'reports',
        icon: 'pi pi-flag',
        items: [
          {
            label: 'Reports Management',
            icon: 'pi pi-file',
            routerLink: '/reports/reports-mangement',
          }
        ],
      },
    ];
  }
}
