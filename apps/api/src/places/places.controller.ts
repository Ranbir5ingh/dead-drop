import { Controller, Get, Query } from "@nestjs/common";
import { IsString, Length } from "class-validator";
import { PlacesService } from "./places.service";

class PlaceQuery {
  @IsString()
  @Length(2, 80)
  q!: string;
}

@Controller("places")
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get()
  search(@Query() query: PlaceQuery) {
    return this.places.search(query.q);
  }
}
