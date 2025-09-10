import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [PanelMenuModule, CommonModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBarComponent {
  @Input() collapsed = false;
  @Input() collapsedOnMobile = true;
  @Input() isMobile = false;
  @Input() hidden = false;

  menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/dashboard'] },
    { label: 'Users', icon: 'pi pi-users', routerLink: ['/users'] },
    { label: 'Settings', icon: 'pi pi-cog', routerLink: ['/settings'] },
  ];
}
