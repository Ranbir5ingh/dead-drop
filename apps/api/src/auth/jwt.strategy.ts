import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { PublicUser } from "@deaddrop/shared";
import type { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ACCESS_COOKIE, readCookie } from "./cookies";
import { AuthService } from "./auth.service";

interface AccessPayload {
  sub?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => readCookie(request?.headers?.cookie, ACCESS_COOKIE),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: AccessPayload): Promise<PublicUser> {
    if (!payload.sub) throw new UnauthorizedException("Log in to keep going.");
    const user = await this.auth.userById(payload.sub);
    if (!user) throw new UnauthorizedException("Log in to keep going.");
    return user;
  }
}
