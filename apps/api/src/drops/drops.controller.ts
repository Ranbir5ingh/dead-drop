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
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { DropsService } from "./drops.service";
import { CreateDropDto } from "./dto/create-drop.dto";
import { CreateFindDto } from "./dto/create-find.dto";
import { HiderNameDto } from "./dto/hider-name.dto";
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
  list() {
    return this.drops.list();
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
  @UseInterceptors(photoUpload)
  create(@Body() dto: CreateDropDto, @UploadedFile() file: unknown) {
    return this.drops.create(dto, asUploadedPhoto(file));
  }

  @Post(":id/publish")
  publish(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: HiderNameDto) {
    return this.drops.publish(id, dto.hiderName);
  }

  @Post(":id/finds")
  @UseInterceptors(photoUpload)
  find(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CreateFindDto,
    @UploadedFile() file: unknown,
  ) {
    return this.finds.attempt(id, dto.finderName, asUploadedPhoto(file));
  }

  @Delete(":id")
  discard(@Param("id", new ParseUUIDPipe()) id: string, @Query() query: HiderNameDto) {
    return this.drops.discard(id, query.hiderName);
  }
}
