export interface EasyGoalAuthConfig {
  /** SSO base URL. Ex: https://sso.easygoal.com.br */
  ssoUrl: string;

  /** App base URL. Ex: https://club.easygoal.com.br */
  appUrl: string;

  /** Callback path on this app. Default: /auth/callback */
  callbackPath?: string;

  /**
   * Secret for signing internal state tokens.
   * Generate: node -e "require('crypto').randomBytes(32).toString('hex')"
   */
  secretKey: string;

  /** Routes that require authentication. Default: ['/profile', '/dashboard'] */
  protectedRoutes?: string[];

  /** Where to redirect unauthenticated users. Default: '/' */
  loginRedirect?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface CallbackResult {
  success: boolean;
  redirectTo?: string;
  error?: string;
}
