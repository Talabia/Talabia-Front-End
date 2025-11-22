// Theme interfaces for API requests and responses

export interface ThemePalette {
  primary: string;
  onPrimary: string;
  outline: string;
  surfaceContainer: string;
  onSecondary: string;
  surface: string;
  onSurface: string;
  onSurfaceVariant: string;
  surfaceContainerLow: string;
  secondary: string;
  primaryFixed: string;
  error: string;
  onError: string;
  onSecondaryContainer: string;
  secondaryFixed: string;
}

export interface Theme {
  id: number;
  name: string;
  description: string;
  lightTheme: ThemePalette;
  darkTheme: ThemePalette;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface ActiveThemeResponse {
  id: number;
  lightTheme: ThemePalette;
  darkTheme: ThemePalette;
}

export interface ThemeDetailsResponse {
  id: number;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  lightTheme: ThemePalette;
  darkTheme: ThemePalette;
}

export interface CreateThemeRequest {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  light: ThemePalette;
  dark: ThemePalette;
}

export interface EditThemeRequest extends CreateThemeRequest {
  id: number;
}

export interface ThemesListRequest {
  searchKeyword?: string;
  pageSize: number;
  currentPage: number;
}

export interface ThemesListResponse {
  data: Theme[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SetActiveRequest {
  id: number;
  status: boolean;
}

export interface SetDefaultRequest {
  id: number;
}
