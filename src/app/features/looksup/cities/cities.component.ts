import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-cities',
  imports: [],
  templateUrl: './cities.component.html',
  styleUrl: './cities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitiesComponent { }
