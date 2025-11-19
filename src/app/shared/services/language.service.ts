import { ApplicationRef, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type SupportedLanguage = 'ar' | 'en';

type TranslationDictionary = Record<string, string>;

type Translations = Record<SupportedLanguage, TranslationDictionary>;

const TRANSLATIONS: Translations = {
  en: {
    'language.ar': 'Arabic',
    'language.en': 'English',
    'header.toggleTheme': 'Toggle Theme',
    'header.toggleLanguage': 'Toggle Language',
    'header.toggleSidebar': 'Toggle Sidebar',
    'sidebar.lookups': 'Lookups',
    'sidebar.users': 'Users',
    'sidebar.analytics': 'Analytics & Statistics',
    'sidebar.reports': 'Reports',
    'sidebar.advertisement': 'Advertisement',
    'sidebar.theme': 'Application Theme',
    'sidebar.customerSupport': 'Customer Support',
    'sidebar.dashboard': 'Dashboard',
    'sidebar.reportsManagement': 'Reports Management',
    'lookups.cities': 'Cities',
    'lookups.conditions': 'Conditions',
    'lookups.sparePartsStatus': 'Spare Parts Status',
    'lookups.vehicleTypes': 'Vehicle Types',
    'lookups.vehicleMakers': 'Vehicle Makers',
    'lookups.vehicleModels': 'Vehicle Models',
    'users.management': 'User Management',
    'common.create': 'Create',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.cancel': 'Cancel',
    'common.update': 'Update',
    'common.refresh': 'Refresh',
    'common.retry': 'Retry',
    'common.view': 'View',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.search': 'Search',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.image': 'Image',
    'common.noImage': 'No Image',
    'common.title': 'Title',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.all': 'All',
    'common.loading': 'Loading...',
    'common.noData': 'No Data Available',
    'analytics.dashboard.header': 'Reports Analytics Dashboard',
    'analytics.dashboard.filterPlaceholder': 'Filter by Time Period',
    'analytics.dashboard.refresh': 'Refresh',
    'analytics.dashboard.loading': 'Loading dashboard data...',
    'analytics.dashboard.totalReports': 'Total Reports',
    'analytics.dashboard.pending': 'Pending',
    'analytics.dashboard.underReview': 'Under Review',
    'analytics.dashboard.resolved': 'Resolved',
    'analytics.dashboard.rejected': 'Rejected',
    'analytics.dashboard.ofTotal': '% of total',
    'analytics.dashboard.statusChartTitle': 'Reports by Status',
    'analytics.dashboard.typeChartTitle': 'Reports by Type',
    'analytics.dashboard.reasonChartTitle': 'Reports by Reason',
    'analytics.dashboard.timelineChartTitle': 'Reports Timeline (Last 7 Days)',
    'analytics.dashboard.axis.reports': 'Number of Reports',
    'analytics.dashboard.axis.days': 'Days',
    'analytics.dashboard.emptyTitle': 'No Data Available',
    'analytics.dashboard.emptyDescription': 'Unable to load dashboard statistics. Please try refreshing the page.',
    'analytics.dashboard.retry': 'Retry',
    'analytics.dashboard.filter.all': 'All Time',
    'analytics.dashboard.filter.7': 'Last 7 Days',
    'analytics.dashboard.filter.30': 'Last 30 Days',
    'analytics.dashboard.filter.90': 'Last 90 Days',
    'analytics.dashboard.filter.year': 'This Year',
    'common.nameAr': 'Name (Arabic)',
    'common.nameEn': 'Name (English)',
    'table.currentPageReport': 'Showing {first} to {last} of {totalRecords} entries',
    'table.empty.search': 'No results found matching "{{keyword}}"',
    'table.empty.default': 'No data available',
    'advertisement.header': 'Advertisement Management',
    'advertisement.searchPlaceholder': 'Search by title...',
    'advertisement.filterStatusPlaceholder': 'Filter by status',
    'advertisement.table.title': 'Title',
    'advertisement.table.image': 'Image',
    'advertisement.table.status': 'Status',
    'advertisement.table.actions': 'Actions',
    'advertisement.empty.search': 'No advertisements found matching "{{keyword}}"',
    'advertisement.empty.default': 'No advertisements available',
    'advertisement.dialog.createTitle': 'Create Advertisement',
    'advertisement.dialog.editTitle': 'Edit Advertisement',
    'advertisement.form.title': 'Title',
    'advertisement.form.status': 'Status',
    'advertisement.form.image': 'Image',
    'advertisement.form.uploadLabel': 'Upload image',
    'advertisement.notification.imageUploadSuccess': 'Image uploaded successfully',
    'advertisement.notification.imageUploadError': 'Failed to upload image',
    'advertisement.notification.createSuccess': 'Advertisement created successfully',
    'advertisement.notification.createError': 'Failed to create advertisement',
    'advertisement.notification.updateSuccess': 'Advertisement updated successfully',
    'advertisement.notification.updateError': 'Failed to update advertisement',
    'advertisement.notification.deleteSuccess': 'Advertisement deleted successfully',
    'advertisement.notification.deleteError': 'Failed to delete advertisement',
    'advertisement.notification.loadError': 'Failed to load advertisements',
    'advertisement.confirm.deleteMessage': 'Are you sure you want to delete "{{title}}"?',
    'advertisement.validation.titleRequired': 'Title is required',
    'advertisement.validation.titleMinLength': 'Title must be at least {{requiredLength}} characters',
    'advertisement.validation.imageRequired': 'Image is required',
  },
  ar: {
    'language.ar': 'العربية',
    'language.en': 'الإنجليزية',
    'header.toggleTheme': 'تبديل الوضع الليلي',
    'header.toggleLanguage': 'تبديل اللغة',
    'header.toggleSidebar': 'إظهار/إخفاء القائمة الجانبية',
    'sidebar.lookups': 'القوائم التعريفية',
    'sidebar.users': 'المستخدمون',
    'sidebar.analytics': 'التحليلات والإحصائيات',
    'sidebar.reports': 'التقارير',
    'sidebar.advertisement': 'الإعلانات',
    'sidebar.theme': 'سمة التطبيق',
    'sidebar.customerSupport': 'دعم العملاء',
    'sidebar.dashboard': 'لوحة المعلومات',
    'sidebar.reportsManagement': 'إدارة التقارير',
    'lookups.cities': 'المدن',
    'lookups.conditions': 'الحالات',
    'lookups.sparePartsStatus': 'حالة قطع الغيار',
    'lookups.vehicleTypes': 'أنواع المركبات',
    'lookups.vehicleMakers': 'مصنّعو المركبات',
    'lookups.vehicleModels': 'طرازات المركبات',
    'users.management': 'إدارة المستخدمين',
    'common.create': 'إنشاء',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.cancel': 'إلغاء',
    'common.update': 'تحديث',
    'common.refresh': 'تحديث البيانات',
    'common.retry': 'إعادة المحاولة',
    'common.view': 'عرض',
    'common.close': 'إغلاق',
    'common.save': 'حفظ',
    'common.actions': 'الإجراءات',
    'common.status': 'الحالة',
    'common.search': 'بحث',
    'common.success': 'نجاح',
    'common.error': 'خطأ',
    'common.image': 'صورة',
    'common.noImage': 'لا توجد صورة',
    'common.title': 'العنوان',
    'common.active': 'نشط',
    'common.inactive': 'غير نشط',
    'common.all': 'الكل',
    'common.loading': 'جارٍ التحميل...',
    'common.noData': 'لا توجد بيانات متاحة',
    'analytics.dashboard.header': 'لوحة تحليلات التقارير',
    'analytics.dashboard.filterPlaceholder': 'تصفية حسب الفترة الزمنية',
    'analytics.dashboard.refresh': 'تحديث',
    'analytics.dashboard.loading': 'جاري تحميل بيانات اللوحة...',
    'analytics.dashboard.totalReports': 'إجمالي التقارير',
    'analytics.dashboard.pending': 'قيد الانتظار',
    'analytics.dashboard.underReview': 'قيد المراجعة',
    'analytics.dashboard.resolved': 'تم الحل',
    'analytics.dashboard.rejected': 'مرفوض',
    'analytics.dashboard.ofTotal': '% من الإجمالي',
    'analytics.dashboard.statusChartTitle': 'التقارير حسب الحالة',
    'analytics.dashboard.typeChartTitle': 'التقارير حسب النوع',
    'analytics.dashboard.reasonChartTitle': 'التقارير حسب السبب',
    'analytics.dashboard.timelineChartTitle': 'الجدول الزمني للتقارير (آخر 7 أيام)',
    'analytics.dashboard.axis.reports': 'عدد التقارير',
    'analytics.dashboard.axis.days': 'الأيام',
    'analytics.dashboard.emptyTitle': 'لا توجد بيانات متاحة',
    'analytics.dashboard.emptyDescription': 'تعذر تحميل إحصائيات اللوحة. يرجى محاولة تحديث الصفحة.',
    'analytics.dashboard.retry': 'إعادة المحاولة',
    'analytics.dashboard.filter.all': 'طوال الفترة',
    'analytics.dashboard.filter.7': 'آخر 7 أيام',
    'analytics.dashboard.filter.30': 'آخر 30 يومًا',
    'analytics.dashboard.filter.90': 'آخر 90 يومًا',
    'analytics.dashboard.filter.year': 'هذا العام',
    'common.nameAr': 'الاسم بالعربية',
    'common.nameEn': 'الاسم بالإنجليزية',
    'table.currentPageReport': 'عرض {first} إلى {last} من أصل {totalRecords} سجل',
    'table.empty.search': 'لا توجد نتائج مطابقة لـ "{{keyword}}"',
    'table.empty.default': 'لا توجد بيانات متاحة',
    'advertisement.header': 'إدارة الإعلانات',
    'advertisement.searchPlaceholder': 'ابحث حسب العنوان...',
    'advertisement.filterStatusPlaceholder': 'تصفية حسب الحالة',
    'advertisement.table.title': 'العنوان',
    'advertisement.table.image': 'الصورة',
    'advertisement.table.status': 'الحالة',
    'advertisement.table.actions': 'الإجراءات',
    'advertisement.empty.search': 'لا توجد إعلانات مطابقة لـ "{{keyword}}"',
    'advertisement.empty.default': 'لا توجد إعلانات متاحة',
    'advertisement.dialog.createTitle': 'إنشاء إعلان',
    'advertisement.dialog.editTitle': 'تعديل إعلان',
    'advertisement.form.title': 'العنوان',
    'advertisement.form.status': 'الحالة',
    'advertisement.form.image': 'الصورة',
    'advertisement.form.uploadLabel': 'رفع صورة',
    'advertisement.notification.imageUploadSuccess': 'تم رفع الصورة بنجاح',
    'advertisement.notification.imageUploadError': 'فشل رفع الصورة',
    'advertisement.notification.createSuccess': 'تم إنشاء الإعلان بنجاح',
    'advertisement.notification.createError': 'فشل إنشاء الإعلان',
    'advertisement.notification.updateSuccess': 'تم تحديث الإعلان بنجاح',
    'advertisement.notification.updateError': 'فشل تحديث الإعلان',
    'advertisement.notification.deleteSuccess': 'تم حذف الإعلان بنجاح',
    'advertisement.notification.deleteError': 'فشل حذف الإعلان',
    'advertisement.notification.loadError': 'فشل تحميل الإعلانات',
    'advertisement.confirm.deleteMessage': 'هل أنت متأكد أنك تريد حذف "{{title}}"؟',
    'advertisement.validation.titleRequired': 'حقل العنوان مطلوب',
    'advertisement.validation.titleMinLength': 'يجب ألا يقل العنوان عن {{requiredLength}} أحرف',
    'advertisement.validation.imageRequired': 'حقل الصورة مطلوب',
  },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly storageKey = 'lang';
  private readonly defaultLang: SupportedLanguage = 'ar';
  private currentLang: SupportedLanguage;
  private readonly languageChange$ = new BehaviorSubject<SupportedLanguage>('ar');
  readonly languageChanged$ = this.languageChange$.asObservable();

  constructor(private appRef: ApplicationRef) {
    this.currentLang = this.loadInitialLanguage();
    this.applyDocumentSettings(this.currentLang);
    this.languageChange$.next(this.currentLang);
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLang;
  }

  setLanguage(lang: SupportedLanguage): SupportedLanguage {
    if (this.currentLang === lang) {
      return this.currentLang;
    }

    this.currentLang = lang;
    this.persistLanguage(lang);
    this.applyDocumentSettings(lang);
    this.requestUiRefresh();
    this.languageChange$.next(this.currentLang);
    return this.currentLang;
  }

  toggleLanguage(): SupportedLanguage {
    return this.setLanguage(this.currentLang === 'ar' ? 'en' : 'ar');
  }

  translate(key: string, params?: Record<string, unknown>): string {
    const dictionary = TRANSLATIONS[this.currentLang] ?? {};
    let value = dictionary[key] ?? key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        const regex = new RegExp(`{{\s*${paramKey}\s*}}`, 'g');
        value = value.replace(regex, String(paramValue ?? ''));
      });
    }

    return value;
  }

  private loadInitialLanguage(): SupportedLanguage {
    if (typeof window === 'undefined') {
      return this.defaultLang;
    }

    try {
      const stored = window.localStorage.getItem(this.storageKey) as SupportedLanguage | null;
      if (stored === 'en' || stored === 'ar') {
        return stored;
      }
    } catch (error) {
      console.warn('Unable to read language from localStorage:', error);
    }

    return this.defaultLang;
  }

  private persistLanguage(lang: SupportedLanguage): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(this.storageKey, lang);
    } catch (error) {
      console.warn('Unable to persist language preference:', error);
    }
  }

  private applyDocumentSettings(lang: SupportedLanguage): void {
    if (typeof document === 'undefined') {
      return;
    }

    const direction = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', direction);
    document.body.classList.toggle('rtl', lang === 'ar');
  }

  private requestUiRefresh(): void {
    queueMicrotask(() => {
      this.appRef.tick();
    });
  }
}
