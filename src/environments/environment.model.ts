/**
 * Shape shared by every environment file.
 * Everything here ends up in the public JS bundle — never put secrets in it.
 */
export interface Environment {
  production: boolean;
  environmentName: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
}
