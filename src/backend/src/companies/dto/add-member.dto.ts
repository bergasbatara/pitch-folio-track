<<<<<<< HEAD
import { IsEmail, IsIn, IsOptional, IsString } from "class-validator";

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @IsIn(["owner", "admin", "member"])
=======
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @IsIn(['owner', 'admin', 'member'])
>>>>>>> 0849f75 (Auth db error)
  role?: string;
}
