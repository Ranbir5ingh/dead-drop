import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { PublicUser } from "@deaddrop/shared";
import type { Request } from "express";
import { AuthService } from "./auth.service";

export type AuthedRequest = Request & { user: PublicUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const user = await this.auth.userFromRequest(req);
    if (!user) throw new UnauthorizedException("Log in to keep going.");
    req.user = user;
    return true;
  }
}
