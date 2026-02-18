import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateCompanyDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  @IsOptional()
  @IsString()
  name?: string;

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
