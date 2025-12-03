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
import { UserAccountManagementComponent } from './features/users/user-account-management/user-account-management.component';
import { DashboardComponent } from './features/analytics-statistics/dashboard/dashboard.component';
import { ReportsMangementComponent } from './features/reports/reports-mangement/reports-mangement.component';
import { UserVerificationsComponent } from './features/users/user-verifications/user-verifications.component';
import { VerificationsStatisticsComponent } from './features/analytics-statistics/verifications-statistics/verifications-statistics.component';
import { NotificationsCenterComponent } from './features/notifications/notifications-center/notifications-center.component';
import { languageGuard } from './shared/guards/language.guard';
import { ChatReivewComponent } from './features/message-chat-review/chat-reivew/chat-reivew.component';

// Define the main routes without language prefix
const mainRoutes: Routes = [
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
    path: 'users',
    children: [
      {
        path: 'user-management',
        component: UserAccountManagementComponent,
      },
      {
        path: 'user-verifications',
        component: UserVerificationsComponent,
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
  {
    path: 'analytics-statistics',
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'verifications-statistics',
        component: VerificationsStatisticsComponent,
      },
    ],
  },
  {
    path: 'reports',
    children: [
      {
        path: 'reports-mangement',
        component: ReportsMangementComponent,
      },
    ],
  },
  {
    path: 'notifications',
    children: [
      {
        path: 'notifications-center',
        component: NotificationsCenterComponent,
      },
    ],
  },
  {
    path: 'message-chat-review',
    children: [
      {
        path: 'chat-reivew',
        component: ChatReivewComponent,
      },
    ],
  },
];

export const routes: Routes = [
  // Language-prefixed routes
  {
    path: ':lang',
    canActivate: [languageGuard],
    children: mainRoutes,
  },
  // Default redirect to Arabic (or preferred default language)
  {
    path: '',
    redirectTo: '/ar',
    pathMatch: 'full',
  },
  // Fallback for any unmatched routes - redirect to default language
  {
    path: '**',
    redirectTo: '/ar',
  },
];
