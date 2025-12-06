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
import { BusinessStatisticsComponent } from './features/analytics-statistics/business-statistics/business-statistics.component';
import { UserStatisticsComponent } from './features/analytics-statistics/user-statistics/user-statistics.component';
import { VehicleStatisticsComponent } from './features/analytics-statistics/vehicle-statistics/vehicle-statistics.component';
import { NotificationsCenterComponent } from './features/notifications/notifications-center/notifications-center.component';
import { languageGuard } from './shared/guards/language.guard';
import { ChatReivewComponent } from './features/message-chat-review/chat-reivew/chat-reivew.component';
import { ContentMangementComponent } from './features/content-mangement/content-mangement/content-mangement.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { OtpComponent } from './features/auth/otp/otp.component';
import { authGuard } from './core/guards/auth.guard';

// Define the main protected routes
const protectedRoutes: Routes = [
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
      {
        path: 'business-statistics',
        component: BusinessStatisticsComponent,
      },
      {
        path: 'user-statistics',
        component: UserStatisticsComponent,
      },
      {
        path: 'vehicle-statistics',
        component: VehicleStatisticsComponent,
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
  {
    path: 'content-management',
    children: [
      {
        path: 'content-offers',
        component: ContentMangementComponent,
      },
    ],
  },
];

export const routes: Routes = [
  // Public Routes (Login, OTP) - No Main Layout, No Auth Guard
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'otp',
    component: OtpComponent,
  },

  // Language-prefixed routes wrapping MainLayout and Protected Routes
  {
    path: ':lang',
    canActivate: [languageGuard], // Ensures lang is valid
    component: MainLayoutComponent, // Wraps content in Header/Sidebar
    canActivateChild: [authGuard], // Protects children
    children: protectedRoutes,
  },

  // Redirect root to default language (which will then hit the guard)
  {
    path: '',
    redirectTo: '/ar',
    pathMatch: 'full',
  },
  // Fallback
  {
    path: '**',
    redirectTo: '/ar',
  },
];
