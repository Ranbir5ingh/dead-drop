import { Type } from "class-transformer";
import { IsNumber, Max, Min } from "class-validator";

export class NearbyQuery {
  @Type(() => Number)
  @IsNumber({}, { message: "Share your location to see nearby hunts." })
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber({}, { message: "Share your location to see nearby hunts." })
  @Min(-180)
  @Max(180)
  lng!: number;
}
