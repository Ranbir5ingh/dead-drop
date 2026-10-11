import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { PublicUser } from "@deaddrop/shared";
import type { AuthedRequest } from "./session.guard";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser => {
    return ctx.switchToHttp().getRequest<AuthedRequest>().user;
  },
);
