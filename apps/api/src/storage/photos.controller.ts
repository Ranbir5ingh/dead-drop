import { Controller, Get, NotFoundException, Param, StreamableFile } from "@nestjs/common";
import { StorageService } from "./storage.service";

@Controller("photos")
export class PhotosController {
  constructor(private readonly storage: StorageService) {}

  @Get(":folder/:name")
  async local(
    @Param("folder") folder: string,
    @Param("name") name: string,
  ): Promise<StreamableFile> {
    const file = await this.storage.readLocal(folder, name);
    if (!file) throw new NotFoundException("That photo is not on this machine.");
    return new StreamableFile(file.bytes, {
      type: file.contentType,
      disposition: "inline",
    });
  }
}
