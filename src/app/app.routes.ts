import { Routes } from '@angular/router';
import { CitiesComponent } from './features/looksup/cities/cities.component';
import { ConditionsComponent } from './features/looksup/conditions/conditions.component';
import { SparePartsStatusComponent } from './features/looksup/spare-parts-status/spare-parts-status.component';
import { VehicleTypesComponent } from './features/looksup/vehicle-types/vehicle-types.component';
import { VehicleMakersComponent } from './features/looksup/vehicle-makers/vehicle-makers.component';
import { VehicleModelsComponent } from './features/looksup/vehicle-models/vehicle-models.component';

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
                {
                    path: 'vehicle-makers',
                    component: VehicleMakersComponent
                },
                {
                    path: 'vehicle-models',
                    component: VehicleModelsComponent
                },

            ]
        }
];
