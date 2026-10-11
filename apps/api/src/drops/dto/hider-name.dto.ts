import { Transform } from "class-transformer";
import { IsString, Length, Matches } from "class-validator";
import { NAME_PATTERN, tidy } from "../../common/names";

export class HiderNameDto {
  @Transform(({ value }) => tidy(value))
  @IsString()
  @Length(2, 40, { message: "Use a display name of 2 to 40 letters." })
  @Matches(NAME_PATTERN, { message: "Use a display name made of letters." })
  hiderName!: string;
}
