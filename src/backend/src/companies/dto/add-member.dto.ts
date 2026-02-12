import { IsEmail, IsIn, IsOptional, IsString } from "class-validator";

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @IsIn(["owner", "admin", "member"])
  role?: string;
}
