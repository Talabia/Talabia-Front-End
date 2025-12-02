import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-notifications-center',
  imports: [],
  templateUrl: './notifications-center.component.html',
  styleUrl: './notifications-center.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsCenterComponent {}
