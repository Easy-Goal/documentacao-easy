import type { EasyGoalAuthConfig } from './types';

let _config: EasyGoalAuthConfig | null = null;

export function configure(config: EasyGoalAuthConfig): void {
  _config = {
    callbackPath: '/auth/callback',
    protectedRoutes: ['/profile', '/dashboard'],
    loginRedirect: '/',
    ...config,
  };
}

export function getConfig(): EasyGoalAuthConfig {
  if (!_config) {
    throw new Error(
      '[EasyGoalAuth] Not configured. Call EasyGoalAuth.configure() before using auth functions.'
    );
  }
  return _config;
}
