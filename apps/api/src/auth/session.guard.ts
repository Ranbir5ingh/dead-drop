import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { PublicUser } from "@deaddrop/shared";
import type { Request } from "express";

export type AuthedRequest = Request & { user: PublicUser };

@Injectable()
export class SessionGuard extends AuthGuard("jwt") {
  handleRequest<TUser = PublicUser>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      throw err instanceof Error ? err : new UnauthorizedException("Log in to keep going.");
    }
    return user;
  }
}
