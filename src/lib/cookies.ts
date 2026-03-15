'use client';

/**
 * Cookie utilities for token management
 * These functions work with browser cookies to store auth tokens
 * This is necessary because Next.js middleware can only access cookies, not localStorage
 */

export interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

const DEFAULT_OPTIONS: CookieOptions = {
  days: 7,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

/**
 * Set a cookie
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof window === 'undefined') return;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (opts.days) {
    const date = new Date();
    date.setTime(date.getTime() + opts.days * 24 * 60 * 60 * 1000);
    cookie += `; expires=${date.toUTCString()}`;
  }

  if (opts.path) cookie += `; path=${opts.path}`;
  if (opts.domain) cookie += `; domain=${opts.domain}`;
  if (opts.secure) cookie += '; secure';
  if (opts.sameSite) cookie += `; samesite=${opts.sameSite}`;

  document.cookie = cookie;
}

/**
 * Get a cookie value
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, options: CookieOptions = {}): void {
  if (typeof window === 'undefined') return;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  if (opts.path) cookie += `; path=${opts.path}`;
  if (opts.domain) cookie += `; domain=${opts.domain}`;

  document.cookie = cookie;
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Token-specific cookie functions
 */
export const tokenCookies = {
  ACCESS_TOKEN: 'erp_access_token',
  REFRESH_TOKEN: 'erp_refresh_token',

  getAccessToken: (): string | null => getCookie(tokenCookies.ACCESS_TOKEN),
  getRefreshToken: (): string | null => getCookie(tokenCookies.REFRESH_TOKEN),

  setTokens: (accessToken: string, refreshToken: string, rememberMe: boolean = false): void => {
    const options: CookieOptions = {
      days: rememberMe ? 30 : 1,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };
    setCookie(tokenCookies.ACCESS_TOKEN, accessToken, options);
    setCookie(tokenCookies.REFRESH_TOKEN, refreshToken, { ...options, days: rememberMe ? 30 : 7 });
  },

  clearTokens: (): void => {
    deleteCookie(tokenCookies.ACCESS_TOKEN);
    deleteCookie(tokenCookies.REFRESH_TOKEN);
  },

  hasAccessToken: (): boolean => hasCookie(tokenCookies.ACCESS_TOKEN),
  hasRefreshToken: (): boolean => hasCookie(tokenCookies.REFRESH_TOKEN),
};

export default tokenCookies;
