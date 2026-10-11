import { Controller, Get } from "@nestjs/common";
import type { HealthResponse } from "@deaddrop/shared";

@Controller()
export class HealthController {
  @Get("health")
  health(): HealthResponse {
    return { ok: true };
  }
}
