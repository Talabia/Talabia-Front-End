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
    },
      {
        id: 11,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 12,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 13,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 14,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 15,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 16,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 17,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 18,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 19,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 20,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 21,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 22,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 23,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 24,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 25,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 26,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 27,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 28,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 29,
        nameAr: 'حائل',
        nameEn: 'Hail',
    },
      {
        id: 30,
        nameAr: 'حائل',
        nameEn: 'Hail',
      }
    ]);
  }

  constructor() { }

}
