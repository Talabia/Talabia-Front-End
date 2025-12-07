import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-content-preview',
  imports: [],
  templateUrl: './content-preview.component.html',
  styleUrl: './content-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPreviewComponent {}
