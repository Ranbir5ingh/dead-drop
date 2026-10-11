import type { Request, Response } from "express";

export const SESSION_COOKIE = "dd_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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

export function setSessionCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: THIRTY_DAYS_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
}

export function clientIp(req: Request): string {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.ip || "unknown";
}
