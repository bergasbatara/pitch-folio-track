import { IsString, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[\d])(?=.*[^A-Za-z0-9]).+/, {
    message: "Password must include upper, lower, number, and symbol",
  })
  newPassword: string;
}
