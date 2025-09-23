import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { CitiesService } from '../services/cities.service';

@Component({
  selector: 'app-cities',
  imports: [CardModule, TableModule, ButtonModule, InputIcon, IconField, InputTextModule, FormsModule, DividerModule, DialogModule],
  templateUrl: './cities.component.html',
  styleUrl: './cities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitiesComponent implements OnInit {
  cities: any[] = [];
  visible: boolean = false;
  constructor(private citiesService: CitiesService, private cdr: ChangeDetectorRef) { }
  ngOnInit(): void {
    this.citiesService.getAll().subscribe((res: any[]) => {
      this.cities = res;
      this.cdr.detectChanges(); // Trigger change detection
    });
  }

  showDialog() {
    this.visible = true;
  }
}
