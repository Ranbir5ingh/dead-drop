import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import type { PublicUser } from "@deaddrop/shared";
import { AuthService } from "./auth.service";
import { clearAuthCookies, clientIp, readCookie, REFRESH_COOKIE, setAuthCookies } from "./cookies";
import { CurrentUser } from "./current-user.decorator";
import { LoginDto, SignupDto } from "./dto/credentials.dto";
import { SessionGuard } from "./session.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get("me")
  async me(@Req() req: Request): Promise<{ user: PublicUser | null }> {
    return { user: await this.auth.userFromRequest(req) };
  }

  @Get("providers")
  providers(): { google: boolean; github: boolean } {
    return {
      google: this.auth.oauthConfigured("google"),
      github: this.auth.oauthConfigured("github"),
    };
  }

  @Post("signup")
  async signup(@Body() dto: SignupDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.signup({ ...dto, ip: clientIp(req) });
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login({ ...dto, ip: clientIp(req) });
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.rotate(readCookie(req.header("cookie"), REFRESH_COOKIE));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return { user: result.user };
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(readCookie(req.header("cookie"), REFRESH_COOKIE));
    clearAuthCookies(res);
    return { ok: true as const };
  }

  @Get("oauth/:provider")
  async start(@Param("provider") provider: string, @Res() res: Response): Promise<void> {
    try {
      const url = await this.auth.beginOAuth(provider);
      res.redirect(url);
    } catch {
      res.redirect(this.auth.frontend("/login?error=oauth-off"));
    }
  }

  @Get("oauth/:provider/callback")
  async callback(
    @Param("provider") provider: string,
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (error || !code || !state) {
      res.redirect(this.auth.frontend("/login?error=oauth"));
      return;
    }
    try {
      const tokens = await this.auth.finishOAuth(provider, code, state);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      res.redirect(this.auth.frontend("/hunt"));
    } catch {
      res.redirect(this.auth.frontend("/login?error=oauth"));
    }
  }

  @Get("session-check")
  @UseGuards(SessionGuard)
  check(@CurrentUser() user: PublicUser): { user: PublicUser } {
    return { user };
  }
}
