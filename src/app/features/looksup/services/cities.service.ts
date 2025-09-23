import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitiesService {  
  getAll() {
    return of([
      {
        id: 1,
        nameAr: 'الرياض',
        nameEn: 'Riyadh',
      },
      {
        id: 2,
        nameAr: 'جدة',
        nameEn: 'Jeddah',
      },
      {
        id: 3,
        nameAr: 'مكة المكرمة',
        nameEn: 'Mecca',
      },
      {
        id: 4,
        nameAr: 'المدينة المنورة',
        nameEn: 'Medina',
      },
      {
        id: 5,
        nameAr: 'الدمام',
        nameEn: 'Dammam',
      },
      {
        id: 6,
        nameAr: 'الطائف',
        nameEn: 'Taif',
      },
      {
        id: 7,
        nameAr: 'تبوك',
        nameEn: 'Tabuk',
      },
      {
        id: 8,
        nameAr: 'بريدة',
        nameEn: 'Buraidah',
      },
      {
        id: 9,
        nameAr: 'خميس مشيط',
        nameEn: 'Khamis Mushait',
      },
      {
        id: 10,
        nameAr: 'حائل',
        nameEn: 'Hail',
      }
    ]);
  }

  constructor() { }

}
