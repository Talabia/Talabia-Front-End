import { Routes } from '@angular/router';
import { CitiesComponent } from './features/looksup/cities/cities.component';
import { ConditionsComponent } from './features/looksup/conditions/conditions.component';
import { SparePartsStatusComponent } from './features/looksup/spare-parts-status/spare-parts-status.component';
import { VehicleTypesComponent } from './features/looksup/vehicle-types/vehicle-types.component';

export const routes: Routes = [
        {
            path: 'looksup',
            children: [
                {
                    path: 'cities',
                    component: CitiesComponent
                },
                {
                    path: 'conditions',
                    component: ConditionsComponent
                },
                {
                    path: 'spare-parts-status',
                    component: SparePartsStatusComponent
                },
                {
                    path: 'vehicle-types',
                    component: VehicleTypesComponent
                },

            ]
        }
];
