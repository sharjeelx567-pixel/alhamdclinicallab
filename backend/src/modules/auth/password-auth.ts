import { HttpStatus, Logger } from '@nestjs/common';
import { AppError } from '../../common/errors';
import { getEnv } from '../../config/env';

/**
 * Email/password sign-in done BY THE SERVER against Firebase Authentication.
 *
 * Why: some lab PCs have browser extensions, proxies or filters that block the browser
 * from reaching googleapis.com (ERR_TUNNEL_CONNECTION_FAILED), while the server can.
 * The browser therefore only talks to this API; the server talks to Google.
 * The ID token returned is a normal Firebase ID token, verified by the auth guard as usual.
 * Uses the public Web API key (FIREBASE_WEB_API_KEY), never the Admin credentials.
 */
export interface FirebaseSession {
  idToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

const log = new Logger('PasswordAuth');

function apiKey(): string {
  const key = getEnv().FIREBASE_WEB_API_KEY;
  if (!key) throw new AppError(HttpStatus.SERVICE_UNAVAILABLE, 'AUTH_NOT_CONFIGURED', 'Sign-in is not configured on the server (FIREBASE_WEB_API_KEY).');
  return key;
}

/** Firebase error codes → clear messages. Wrong email and wrong password give the same answer. */
function authError(code: string): AppError {
  if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND|INVALID_EMAIL|MISSING_PASSWORD/.test(code))
    return new AppError(HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  if (code.startsWith('USER_DISABLED')) return new AppError(HttpStatus.FORBIDDEN, 'ACCOUNT_DISABLED', 'This account has been disabled. Contact the laboratory administrator.');
  if (code.startsWith('TOO_MANY_ATTEMPTS')) return new AppError(HttpStatus.TOO_MANY_REQUESTS, 'TOO_MANY_ATTEMPTS', 'Too many attempts. Please wait a few minutes and try again.');
  if (/TOKEN_EXPIRED|INVALID_REFRESH_TOKEN|USER_NOT_FOUND|INVALID_ID_TOKEN/.test(code))
    return new AppError(HttpStatus.UNAUTHORIZED, 'SESSION_EXPIRED', 'Your session has ended. Please sign in again.');
  if (code.startsWith('WEAK_PASSWORD')) return new AppError(HttpStatus.BAD_REQUEST, 'WEAK_PASSWORD', 'Choose a stronger password (at least 10 characters).');
  log.warn(`Firebase Auth error: ${code}`);
  return new AppError(HttpStatus.BAD_GATEWAY, 'AUTH_PROVIDER_ERROR', 'Sign-in service is not available right now. Please try again.');
}

async function post<T>(url: string, body: unknown, form = false): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' },
      body: form ? new URLSearchParams(body as Record<string, string>).toString() : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new AppError(HttpStatus.BAD_GATEWAY, 'AUTH_PROVIDER_UNREACHABLE', 'The server could not reach the sign-in service. Check the internet connection of the server.');
  }
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw authError(json.error?.message ?? `HTTP_${res.status}`);
  return json;
}

export async function signInWithPassword(email: string, password: string): Promise<FirebaseSession> {
  const r = await post<{ idToken: string; refreshToken: string; expiresIn: string }>(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey()}`,
    { email, password, returnSecureToken: true },
  );
  return { idToken: r.idToken, refreshToken: r.refreshToken, expiresIn: Number(r.expiresIn) || 3600 };
}

export async function refreshSession(refreshToken: string): Promise<FirebaseSession> {
  const r = await post<{ id_token: string; refresh_token: string; expires_in: string }>(
    `https://securetoken.googleapis.com/v1/token?key=${apiKey()}`,
    { grant_type: 'refresh_token', refresh_token: refreshToken },
    true,
  );
  return { idToken: r.id_token, refreshToken: r.refresh_token, expiresIn: Number(r.expires_in) || 3600 };
}
