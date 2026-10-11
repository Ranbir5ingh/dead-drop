import type { Request, Response } from "express";

export const ACCESS_COOKIE = "dd_access";
export const REFRESH_COOKIE = "dd_refresh";
const LEGACY_COOKIE = "dd_session";

export const ACCESS_MS = 15 * 60 * 1000;
export const REFRESH_MS = 30 * 24 * 60 * 60 * 1000;

function base(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // The browser only talks to this site (`/backend` proxies the API), so Lax
    // is a first-party cookie. SameSite=None was dropped on refresh.
    sameSite: "lax",
    path: "/",
  };
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const options = base();
  res.cookie(ACCESS_COOKIE, accessToken, { ...options, maxAge: ACCESS_MS });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...options, maxAge: REFRESH_MS });
}

export function clearAuthCookies(res: Response): void {
  const options = base();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, LEGACY_COOKIE]) {
    res.cookie(name, "", { ...options, maxAge: 0 });
  }
}

export function clientIp(req: Request): string {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.ip || "unknown";
}
