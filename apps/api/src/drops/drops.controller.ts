import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { PublicUser } from "@deaddrop/shared";
import { memoryStorage } from "multer";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { DropsService } from "./drops.service";
import { CreateDropDto } from "./dto/create-drop.dto";
import { NearbyQuery } from "./dto/nearby.query";
import { FindsService } from "./finds.service";
import { asUploadedPhoto, MAX_PHOTO_BYTES } from "./photo";

const photoUpload = FileInterceptor("photo", {
  storage: memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
});

@Controller("drops")
export class DropsController {
  constructor(
    private readonly drops: DropsService,
    private readonly finds: FindsService,
  ) {}

  @Get()
  list(@Query() query: NearbyQuery) {
    return this.drops.list(query.lat, query.lng);
  }

  @Get("mine")
  @UseGuards(SessionGuard)
  mine(@CurrentUser() user: PublicUser) {
    return this.drops.forHider(user.displayName);
  }

  @Get("by-hider/:name")
  byHider(@Param("name") name: string) {
    return this.drops.forHider(name);
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.drops.get(id);
  }

  @Post()
  @UseGuards(SessionGuard)
  @UseInterceptors(photoUpload)
  create(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateDropDto,
    @UploadedFile() file: unknown,
  ) {
    return this.drops.create(dto, user, asUploadedPhoto(file));
  }

  @Post(":id/publish")
  @UseGuards(SessionGuard)
  publish(@CurrentUser() user: PublicUser, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.drops.publish(id, user);
  }

  @Post(":id/finds")
  @UseGuards(SessionGuard)
  @UseInterceptors(photoUpload)
  find(
    @CurrentUser() user: PublicUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @UploadedFile() file: unknown,
  ) {
    return this.finds.attempt(id, user, asUploadedPhoto(file));
  }

  @Delete(":id")
  @UseGuards(SessionGuard)
  discard(@CurrentUser() user: PublicUser, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.drops.discard(id, user);
  }
}
