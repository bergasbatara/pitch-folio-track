import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @Transform(({ value }) => String(value ?? "").trim().toLowerCase())
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[\d])(?=.*[^A-Za-z0-9]).+/, {
    message: "Password must include upper, lower, number, and symbol",
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}
