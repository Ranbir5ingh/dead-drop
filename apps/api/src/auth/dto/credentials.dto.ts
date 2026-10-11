import { Transform } from "class-transformer";
import { IsEmail, IsString, Length, Matches } from "class-validator";
import { NAME_PATTERN, tidy } from "../../common/names";

export class SignupDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: "Use a real email address." })
  email!: string;

  @IsString()
  @Length(10, 200, { message: "Use a password of at least 10 characters." })
  password!: string;

  @Transform(({ value }) => tidy(value))
  @IsString()
  @Length(2, 40, { message: "Use a display name of 2 to 40 letters." })
  @Matches(NAME_PATTERN, { message: "Use a display name made of letters." })
  displayName!: string;
}

export class LoginDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: "Use a real email address." })
  email!: string;

  @IsString()
  @Length(1, 200)
  password!: string;
}
