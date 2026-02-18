<<<<<<< HEAD
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCompanyDto {
  @Transform(({ value }) => String(value ?? ""))
  @IsNotEmpty()
  name: string;
=======
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @Transform(({ value }) => String(value ?? ''))
  @IsNotEmpty()
  name!: string;
>>>>>>> 0849f75 (Auth db error)

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  @IsOptional()
  @IsString()
  address?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  @IsOptional()
  @IsString()
  phone?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  @IsOptional()
  @IsEmail()
  email?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  @IsOptional()
  @IsString()
  taxId?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  @IsOptional()
  @IsString()
  currency?: string;
}
