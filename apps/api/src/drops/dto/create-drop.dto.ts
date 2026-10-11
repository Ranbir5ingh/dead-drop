import { Transform } from "class-transformer";
import { IsString, Length, Matches } from "class-validator";
import { tidy } from "../../common/names";
import { NAME_PATTERN } from "../../common/names";

const AREA_PATTERN =
  /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s'.-]{0,78}[\p{L}\p{M}\p{N}.]?$/u;

export class CreateDropDto {
  @Transform(({ value }) => tidy(value))
  @IsString()
  @Length(10, 600, {
    message: "Describe the vicinity in 10 to 600 characters, without an exact address.",
  })
  @Matches(/^[^\u0000-\u001F<>]+$/u, {
    message: "The vicinity description has characters we will not store.",
  })
  vicinityDescription!: string;

  @Transform(({ value }) => tidy(value))
  @IsString()
  @Length(5, 300, {
    message: "Tell the referee what you hid, in 5 to 300 characters. Hunters never see this.",
  })
  @Matches(/^[^\u0000-\u001F<>]+$/u, {
    message: "The object description has characters we will not store.",
  })
  objectDescription!: string;

  @Transform(({ value }) => tidy(value))
  @IsString()
  @Length(2, 80, { message: "Give a broad area name, like a park or a neighborhood." })
  @Matches(AREA_PATTERN, {
    message: "Use a broad area name — a park or a neighborhood, not a full address.",
  })
  areaName!: string;

  @Transform(({ value }) => tidy(value))
  @IsString()
  @Length(2, 40, { message: "Use a display name of 2 to 40 letters." })
  @Matches(NAME_PATTERN, { message: "Use a display name made of letters." })
  hiderName!: string;
}
