import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import { DbModule } from "./db/db.module";
import { DropsModule } from "./drops/drops.module";
import { HealthController } from "./health/health.controller";
import { LeaderboardModule } from "./leaderboard/leaderboard.module";
import { PlacesModule } from "./places/places.module";
import { StorageModule } from "./storage/storage.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AiModule,
    AuthModule,
    PlacesModule,
    StorageModule,
    DropsModule,
    LeaderboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
