import { Transform } from "class-transformer";
import { IsEmail, IsISO8601, IsOptional, IsString } from "class-validator";

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

  @Transform(({ value }) =>
    value === undefined || value === null ? undefined : String(value).trim().toLowerCase(),
  )
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

  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    return String(value);
  })
  @IsOptional()
  @IsISO8601()
  closedThrough?: string | null;
}
