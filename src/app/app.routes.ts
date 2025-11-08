import { Routes } from '@angular/router';
import { CitiesComponent } from './features/looksup/cities/cities.component';
import { ConditionsComponent } from './features/looksup/conditions/conditions.component';
import { SparePartsStatusComponent } from './features/looksup/spare-parts-status/spare-parts-status.component';
import { VehicleTypesComponent } from './features/looksup/vehicle-types/vehicle-types.component';
import { VehicleMakersComponent } from './features/looksup/vehicle-makers/vehicle-makers.component';
import { VehicleModelsComponent } from './features/looksup/vehicle-models/vehicle-models.component';
import { AdvertisementManagementComponent } from './features/advertisement/advertisement-management/advertisement-management.component';
import { ThemeManagementComponent } from './features/application theme/theme management/theme management.component';
import { CustomerSupportMangementComponent } from './features/customer-support/customer-support-mangement/customer-support-mangement.component';

export const routes: Routes = [
  {
    path: '',
    component: AdvertisementManagementComponent,
  },
  {
    path: 'looksup',
    children: [
      {
        path: 'cities',
        component: CitiesComponent,
      },
      {
        path: 'conditions',
        component: ConditionsComponent,
      },
      {
        path: 'spare-parts-status',
        component: SparePartsStatusComponent,
      },
      {
        path: 'vehicle-types',
        component: VehicleTypesComponent,
      },
      {
        path: 'vehicle-makers',
        component: VehicleMakersComponent,
      },
      {
        path: 'vehicle-models',
        component: VehicleModelsComponent,
      },
    ],
  },
  {
    path: 'advertisement',
    children: [
      {
        path: 'advertisement-management',
        component: AdvertisementManagementComponent,
      },
    ],
  },
  {
    path: 'application-theme',
    children: [
      {
        path: 'theme-management',
        component: ThemeManagementComponent,
      },
    ],
  },
  {
    path: 'customer-support',
    children: [
      {
        path: 'customer-support-mangement',
        component: CustomerSupportMangementComponent,
      },
    ],
  },
];
