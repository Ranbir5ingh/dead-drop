import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { StorageModule } from "../storage/storage.module";
import { DropsController } from "./drops.controller";
import { DropsService } from "./drops.service";
import { FindsService } from "./finds.service";

@Module({
  imports: [AiModule, StorageModule],
  controllers: [DropsController],
  providers: [DropsService, FindsService],
})
export class DropsModule {}
