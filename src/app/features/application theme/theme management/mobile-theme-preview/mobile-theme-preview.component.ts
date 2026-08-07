import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ThemePalette } from '../../models/theme.models';

export type ThemeRegionKey = keyof ThemePalette;

export interface RegionClickEvent {
  key: ThemeRegionKey;
  sourceEvent: Event;
}

@Component({
  selector: 'app-mobile-theme-preview',
  standalone: true,
  imports: [],
  templateUrl: './mobile-theme-preview.component.html',
  styleUrl: './mobile-theme-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileThemePreviewComponent {
  palette = input.required<ThemePalette>();
  activeKey = input<ThemeRegionKey | null>(null);

  regionClick = output<RegionClickEvent>();

  onRegionClick(key: ThemeRegionKey, sourceEvent: Event): void {
    sourceEvent.stopPropagation();
    this.regionClick.emit({ key, sourceEvent });
  }
}
