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
  @Input() collapsed = false;
  @Input() collapsedOnMobile = true;
  @Input() isMobile = false;
  @Input() hidden = false;

  menuItems = [{ label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/dashboard'] }];
  items: MenuItem[] | undefined;

  constructor(private router: Router) {}

  ngOnInit() {
    this.items = [
      {
        label: 'Lookups',
        icon: 'pi pi-book',
        items: [
          {
            label: 'Installation',
            icon: 'pi pi-eraser',
            routerLink: '/installation',
          },
          {
            label: 'Configuration',
            icon: 'pi pi-heart',
            routerLink: '/configuration',
          },
        ],
      },
    ];
  }
}
