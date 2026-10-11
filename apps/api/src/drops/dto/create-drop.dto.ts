import { Transform } from "class-transformer";
import { IsString, IsUUID, Length, Matches } from "class-validator";
import { tidy } from "../../common/names";

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

  @IsUUID("4", { message: "Pick a place from the search list." })
  placeId!: string;
}
