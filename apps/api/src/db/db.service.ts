import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

@Injectable()
export class DbService implements OnModuleDestroy {
  readonly sql: postgres.Sql;
  readonly orm: ReturnType<typeof drizzle<typeof schema>>;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>("DATABASE_URL");
    this.sql = postgres(url, { prepare: false, max: 5, idle_timeout: 20 });
    this.orm = drizzle(this.sql, { schema });
  }

  async onModuleDestroy(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }
}
