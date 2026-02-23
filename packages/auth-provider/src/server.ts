import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { getConfig } from './config';
import type { UserProfile, CallbackResult } from './types';

const COOKIE_ACCESS_TOKEN = 'eg_access_token';
const COOKIE_REFRESH_TOKEN = 'eg_refresh_token';
const COOKIE_STATE = 'eg_oauth_state';

/**
 * Generates the SSO login URL and sets the CSRF state cookie.
 * Call this in a Server Component or Route Handler to start the login flow.
 */
export async function getLoginUrl(redirectAfter?: string): Promise<string> {
  const config = getConfig();
  const state = randomBytes(16).toString('hex');

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_STATE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  const callbackUri = `${config.appUrl}${config.callbackPath}`;
  const params = new URLSearchParams({
    redirect_uri: callbackUri,
    state,
    ...(redirectAfter ? { redirect_after: redirectAfter } : {}),
  });

  return `${config.ssoUrl}/auth/login?${params.toString()}`;
}

/**
 * Handles the SSO callback: validates the CSRF state and saves tokens in httpOnly cookies.
 * Call this in the callback Route Handler (`app/auth/callback/route.ts`).
 */
export async function handleCallback(
  searchParams: URLSearchParams
): Promise<CallbackResult> {
  const config = getConfig();
  const cookieStore = await cookies();

  const access_token = searchParams.get('access_token');
  const refresh_token = searchParams.get('refresh_token');
  const state = searchParams.get('state');
  const redirectAfter = searchParams.get('redirect_after');

  if (!access_token || !refresh_token || !state) {
    return { success: false, error: 'missing_params' };
  }

  // Validate CSRF state
  const savedState = cookieStore.get(COOKIE_STATE)?.value;
  if (!savedState || savedState !== state) {
    return { success: false, error: 'invalid_state' };
  }

  // Clear state cookie
  cookieStore.delete(COOKIE_STATE);

  // Save tokens in httpOnly cookies (never accessible from JavaScript)
  cookieStore.set(COOKIE_ACCESS_TOKEN, access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  cookieStore.set(COOKIE_REFRESH_TOKEN, refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return {
    success: true,
    redirectTo: redirectAfter ?? config.loginRedirect ?? '/',
  };
}

/**
 * Returns the authenticated user's profile fetched from SSO, or null if unauthenticated.
 * Safe to call from Server Components — token never leaves the server.
 */
export async function getProfile(): Promise<UserProfile | null> {
  const config = getConfig();
  const cookieStore = await cookies();
  const access_token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

  if (!access_token) return null;

  try {
    const res = await fetch(`${config.ssoUrl}/api/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json() as Promise<UserProfile>;
  } catch {
    return null;
  }
}

/**
 * Clears authentication cookies (logout).
 * Call this in a logout Route Handler.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_ACCESS_TOKEN);
  cookieStore.delete(COOKIE_REFRESH_TOKEN);
}

/**
 * Returns the raw access token from cookies, or null if absent.
 * Use this when you need to forward the token to an external API from a Server Component.
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_ACCESS_TOKEN)?.value ?? null;
}
