import { randomUUID } from "node:crypto";
import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { PublicUser } from "@deaddrop/shared";
import { and, eq, gt, sql } from "drizzle-orm";
import { NAME_PATTERN } from "../common/names";
import { DbService } from "../db/db.service";
import { oauthStates, sessions, users } from "../db/schema";
import { ACCESS_COOKIE, readCookie, REFRESH_MS } from "./cookies";
import { hashPassword, hashToken, newToken, verifyPassword } from "./password";
import type { Request } from "express";
const STATE_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

type ProviderName = "google" | "github";

function limit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

function isProvider(value: string): value is ProviderName {
  return value === "google" || value === "github";
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DbService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async signup(input: {
    email: string;
    password: string;
    displayName: string;
    ip: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
    if (!limit(`signup:${input.ip}`, 8, 15 * 60 * 1000)) {
      throw new UnauthorizedException("Too many signups from this network. Wait a few minutes.");
    }
    this.assertPassword(input.password, input.email);
    const email = input.email.toLowerCase();
    const displayName = input.displayName;
    if (!NAME_PATTERN.test(displayName)) {
      throw new UnauthorizedException("Use a display name made of letters.");
    }
    await this.assertNameFree(displayName);
    const passwordHash = await hashPassword(input.password);
    try {
      const [row] = await this.db.orm
        .insert(users)
        .values({ email, passwordHash, displayName })
        .returning();
      if (!row) throw new ConflictException("The account did not save.");
      const tokens = await this.issuePair(row.id);
      return { ...tokens, user: this.publicUser(row) };
    } catch (error) {
      if (isUnique(error)) {
        throw new ConflictException("That email already has an account. Log in instead.");
      }
      throw error;
    }
  }

  async login(input: {
    email: string;
    password: string;
    ip: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
    if (!limit(`login:${input.ip}`, 10, 15 * 60 * 1000)) {
      throw new UnauthorizedException("Too many tries. Wait a few minutes, then try again.");
    }
    const email = input.email.toLowerCase();
    const [row] = await this.db.orm.select().from(users).where(eq(users.email, email)).limit(1);
    const hash = row?.passwordHash;
    const ok = hash ? await verifyPassword(input.password, hash) : false;
    if (!row || !ok) {
      throw new UnauthorizedException("That email and password do not match.");
    }
    const tokens = await this.issuePair(row.id);
    return { ...tokens, user: this.publicUser(row) };
  }

  async logout(refreshToken: string | null): Promise<void> {
    if (!refreshToken) return;
    const [row] = await this.db.orm
      .select({ familyId: sessions.familyId })
      .from(sessions)
      .where(eq(sessions.tokenHash, hashToken(refreshToken)))
      .limit(1);
    if (!row) return;
    await this.db.orm
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.familyId, row.familyId));
  }

  async userFromRequest(req: Request): Promise<PublicUser | null> {
    const token = readCookie(req.header("cookie"), ACCESS_COOKIE);
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: string }>(token);
      if (!payload.sub) return null;
      return this.userById(payload.sub);
    } catch {
      return null;
    }
  }

  async userById(id: string): Promise<PublicUser | null> {
    const [row] = await this.db.orm
      .select({ id: users.id, email: users.email, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ?? null;
  }

  async rotate(refreshToken: string | null): Promise<{
    accessToken: string;
    refreshToken: string;
    user: PublicUser;
  }> {
    if (!refreshToken) throw new UnauthorizedException("Log in to keep going.");
    const now = new Date();
    const [row] = await this.db.orm
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, hashToken(refreshToken)))
      .limit(1);
    if (!row) throw new UnauthorizedException("Log in to keep going.");
    if (row.revokedAt || row.expiresAt <= now) {
      const justRotated =
        row.revokedAt !== null && now.getTime() - row.revokedAt.getTime() < 30_000;
      if (!justRotated) {
        await this.db.orm
          .update(sessions)
          .set({ revokedAt: now })
          .where(eq(sessions.familyId, row.familyId));
      }
      throw new UnauthorizedException("That session ended. Log in again.");
    }
    await this.db.orm.update(sessions).set({ revokedAt: now }).where(eq(sessions.id, row.id));
    const user = await this.userById(row.userId);
    if (!user) throw new UnauthorizedException("Log in to keep going.");
    const tokens = await this.issuePair(row.userId, row.familyId);
    return { ...tokens, user };
  }

  oauthConfigured(provider: string): boolean {
    if (!isProvider(provider)) return false;
    return Boolean(this.clientId(provider) && this.clientSecret(provider));
  }

  async beginOAuth(provider: string): Promise<string> {
    if (!isProvider(provider) || !this.oauthConfigured(provider)) {
      throw new ServiceUnavailableException(
        "That sign-in is not configured on the server yet. Email and password still work.",
      );
    }
    const state = newToken();
    await this.db.orm.insert(oauthStates).values({
      provider,
      stateHash: hashToken(state),
      expiresAt: new Date(Date.now() + STATE_MS),
    });
    const redirect = this.callbackUrl(provider);
    const params = new URLSearchParams({
      client_id: this.clientId(provider),
      redirect_uri: redirect,
      state,
      response_type: "code",
      scope: provider === "google" ? "openid email profile" : "read:user user:email",
    });
    if (provider === "google") params.set("prompt", "select_account");
    const base =
      provider === "google"
        ? "https://accounts.google.com/o/oauth2/v2/auth"
        : "https://github.com/login/oauth/authorize";
    return `${base}?${params.toString()}`;
  }

  async finishOAuth(
    provider: string,
    code: string,
    state: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!isProvider(provider) || !this.oauthConfigured(provider)) {
      throw new ServiceUnavailableException("That sign-in is not configured.");
    }
    const now = new Date();
    const [saved] = await this.db.orm
      .delete(oauthStates)
      .where(
        and(
          eq(oauthStates.provider, provider),
          eq(oauthStates.stateHash, hashToken(state)),
          gt(oauthStates.expiresAt, now),
        ),
      )
      .returning();
    if (!saved) throw new UnauthorizedException("That sign-in expired. Start again.");

    const profile = await this.exchange(provider, code);
    const user = await this.upsertOAuth(provider, profile);
    return this.issuePair(user.id);
  }

  frontend(path: string): string {
    const origin = (this.config.get<string>("FRONTEND_URL") ?? "http://127.0.0.1:4317")
      .split(",")[0]
      ?.trim();
    return `${origin}${path}`;
  }

  private async exchange(
    provider: ProviderName,
    code: string,
  ): Promise<{ sub: string; email: string; name: string }> {
    const body = new URLSearchParams({
      client_id: this.clientId(provider),
      client_secret: this.clientSecret(provider),
      code,
      redirect_uri: this.callbackUrl(provider),
      grant_type: "authorization_code",
    });
    const tokenUrl =
      provider === "google"
        ? "https://oauth2.googleapis.com/token"
        : "https://github.com/login/oauth/access_token";
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    const tokenBody: unknown = await tokenResponse.json().catch(() => null);
    const access =
      tokenBody && typeof tokenBody === "object" && "access_token" in tokenBody
        ? (tokenBody as { access_token: unknown }).access_token
        : null;
    if (!tokenResponse.ok || typeof access !== "string") {
      throw new UnauthorizedException("The sign-in provider did not finish.");
    }
    if (provider === "google") return this.googleProfile(access);
    return this.githubProfile(access);
  }

  private async googleProfile(access: string): Promise<{ sub: string; email: string; name: string }> {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${access}` },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object") {
      throw new UnauthorizedException("Google did not share an account.");
    }
    const record = body as { sub?: unknown; email?: unknown; email_verified?: unknown; name?: unknown };
    if (record.email_verified === false) {
      throw new UnauthorizedException("Google has not verified that email.");
    }
    if (typeof record.sub !== "string" || typeof record.email !== "string") {
      throw new UnauthorizedException("Google did not share an email.");
    }
    const name = typeof record.name === "string" && record.name.trim() ? record.name : "Hunter";
    return { sub: record.sub, email: record.email.toLowerCase(), name: clipName(name) };
  }

  private async githubProfile(access: string): Promise<{ sub: string; email: string; name: string }> {
    const response = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access}`, Accept: "application/vnd.github+json", "User-Agent": "DeadDrop" },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object") {
      throw new UnauthorizedException("GitHub did not share an account.");
    }
    const record = body as { id?: unknown; email?: unknown; name?: unknown; login?: unknown };
    if (typeof record.id !== "number" && typeof record.id !== "string") {
      throw new UnauthorizedException("GitHub did not share an account.");
    }
    let email = typeof record.email === "string" ? record.email : "";
    if (!email) email = await this.githubEmail(access);
    if (!email) throw new UnauthorizedException("GitHub did not share a verified email.");
    const label =
      (typeof record.name === "string" && record.name.trim()) ||
      (typeof record.login === "string" && record.login) ||
      "Hunter";
    return { sub: String(record.id), email: email.toLowerCase(), name: clipName(label) };
  }

  private async githubEmail(access: string): Promise<string> {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${access}`, Accept: "application/vnd.github+json", "User-Agent": "DeadDrop" },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!Array.isArray(body)) return "";
    const verified = body.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as { verified?: unknown }).verified === true &&
        typeof (item as { email?: unknown }).email === "string",
    ) as { email: string; primary?: boolean } | undefined;
    const primary = body.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as { primary?: unknown }).primary === true &&
        (item as { verified?: unknown }).verified === true,
    ) as { email?: string } | undefined;
    return primary?.email || verified?.email || "";
  }

  private async upsertOAuth(
    provider: ProviderName,
    profile: { sub: string; email: string; name: string },
  ): Promise<{ id: string }> {
    const column = provider === "google" ? users.googleSub : users.githubId;
    const [linked] = await this.db.orm.select().from(users).where(eq(column, profile.sub)).limit(1);
    if (linked) return linked;
    const [byEmail] = await this.db.orm.select().from(users).where(eq(users.email, profile.email)).limit(1);
    if (byEmail) {
      await this.db.orm
        .update(users)
        .set(provider === "google" ? { googleSub: profile.sub } : { githubId: profile.sub })
        .where(eq(users.id, byEmail.id));
      return byEmail;
    }
    const displayName = await this.uniqueName(profile.name);
    const [created] = await this.db.orm
      .insert(users)
      .values({
        email: profile.email,
        displayName,
        googleSub: provider === "google" ? profile.sub : null,
        githubId: provider === "github" ? profile.sub : null,
      })
      .returning();
    if (!created) throw new ConflictException("The account did not save.");
    return created;
  }

  private async uniqueName(seed: string): Promise<string> {
    const base = clipName(seed);
    for (let i = 0; i < 6; i += 1) {
      const candidate = i === 0 ? base : `${base} ${i + 1}`.slice(0, 40);
      if (!NAME_PATTERN.test(candidate)) continue;
      const [taken] = await this.db.orm
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.displayName}) = ${candidate.toLowerCase()}`)
        .limit(1);
      if (!taken) return candidate;
    }
    return clipName(`${base} ${newToken().slice(0, 4)}`);
  }

  private async assertNameFree(displayName: string): Promise<void> {
    const [taken] = await this.db.orm
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.displayName}) = ${displayName.toLowerCase()}`)
      .limit(1);
    if (taken) throw new ConflictException("That display name is taken. Pick another.");
  }

  private assertPassword(password: string, email: string): void {
    if (password.length < 10 || password.length > 200) {
      throw new UnauthorizedException("Use a password of at least 10 characters.");
    }
    if (password.toLowerCase() === email.toLowerCase()) {
      throw new UnauthorizedException("Don't use your email as the password.");
    }
  }

  private async issuePair(
    userId: string,
    familyId?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = newToken();
    await this.db.orm.insert(sessions).values({
      userId,
      tokenHash: hashToken(refreshToken),
      familyId: familyId ?? randomUUID(),
      expiresAt: new Date(Date.now() + REFRESH_MS),
    });
    const accessToken = await this.jwt.signAsync({ sub: userId });
    return { accessToken, refreshToken };
  }

  private publicUser(row: { id: string; email: string; displayName: string }): PublicUser {
    return { id: row.id, email: row.email, displayName: row.displayName };
  }

  private clientId(provider: ProviderName): string {
    const key = provider === "google" ? "GOOGLE_OAUTH_CLIENT_ID" : "GITHUB_OAUTH_CLIENT_ID";
    return this.config.get<string>(key)?.trim() ?? "";
  }

  private clientSecret(provider: ProviderName): string {
    const key = provider === "google" ? "GOOGLE_OAUTH_CLIENT_SECRET" : "GITHUB_OAUTH_CLIENT_SECRET";
    return this.config.get<string>(key)?.trim() ?? "";
  }

  private callbackUrl(provider: ProviderName): string {
    const explicit = this.config.get<string>("API_PUBLIC_URL")?.trim().replace(/\/$/, "");
    // Default through the web proxy so the session cookie is set on the site.
    const origin = explicit || "http://127.0.0.1:4317/backend";
    return `${origin}/api/auth/oauth/${provider}/callback`;
  }
}

function clipName(value: string): string {
  const cleaned = value.replace(/[^\p{L}\p{M}\s'.-]/gu, " ").trim().replace(/\s+/g, " ");
  const sliced = cleaned.slice(0, 40).trim();
  return sliced.length >= 2 ? sliced : "Hunter";
}

function isUnique(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code: unknown }).code === "23505");
}
