import { configure, getConfig } from './config';
import {
  getLoginUrl,
  handleCallback,
  getProfile,
  clearSession,
  getAccessToken,
} from './server';

/**
 * Easy Goal Auth Provider
 *
 * Entry point for SSO integration in Next.js apps.
 *
 * @example
 * // lib/auth.ts — configure once at app startup
 * import { EasyGoalAuth } from '@easygoal/auth-provider';
 *
 * EasyGoalAuth.configure({
 *   ssoUrl: process.env.NEXT_PUBLIC_SSO_URL!,
 *   appUrl: process.env.NEXT_PUBLIC_APP_URL!,
 *   secretKey: process.env.SECRET_KEY!,
 * });
 */
export const EasyGoalAuth = {
  configure,
  getConfig,
  getLoginUrl,
  handleCallback,
  getProfile,
  clearSession,
  getAccessToken,
};

export type {
  EasyGoalAuthConfig,
  UserProfile,
  AuthTokens,
  CallbackResult,
} from './types';

export { createAuthMiddleware } from './middleware';
