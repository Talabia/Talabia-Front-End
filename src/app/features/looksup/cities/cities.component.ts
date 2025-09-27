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
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { CitiesService } from '../services/cities.service';
import { ConfirmationService, MessageService } from 'primeng/api';
@Component({
  selector: 'app-cities',
  imports: [CardModule, TableModule, ButtonModule, InputIcon, IconField, InputTextModule, FormsModule, DividerModule, DialogModule, TooltipModule, ToastModule, ConfirmPopupModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './cities.component.html',
  styleUrl: './cities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitiesComponent implements OnInit {
    cities: any[] = [];
  visible: boolean = false;
  constructor(private citiesService: CitiesService, private cdr: ChangeDetectorRef,private confirmationService: ConfirmationService, private messageService: MessageService) { }
  ngOnInit(): void {
    this.citiesService.getAll().subscribe((res: any[]) => {
      this.cities = res;
      this.cdr.detectChanges(); // Trigger change detection
    });
  }

  showDialog() {
    this.visible = true;
  }
  first = 0;

  rows = 10;



  next() {
      this.first = this.first + this.rows;
  }

  prev() {
      this.first = this.first - this.rows;
  }

  reset() {
      this.first = 0;
  }

  pageChange(event: { first: number; rows: number; }) {
      this.first = event.first;
      this.rows = event.rows;
  }

  isLastPage(): boolean {
      return this.cities ? this.first + this.rows >= this.cities.length : true;
  }

  isFirstPage(): boolean {
      return this.cities ? this.first === 0 : true;
  }
  confirmDelete(event: Event) {
    this.confirmationService.confirm({
        target: event.currentTarget as EventTarget,
        message: 'Do you want to delete this record?',
        icon: 'pi pi-info-circle',
        rejectButtonProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptButtonProps: {
            label: 'Delete',
            severity: 'danger'
        },
        accept: () => {
            this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'Record deleted', life: 3000 });
        },
        reject: () => {
            this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
        }
    });
}
}
