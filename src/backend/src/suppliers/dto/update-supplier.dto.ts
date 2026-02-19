import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class UpdateSupplierDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  name?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  type?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  address?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  email?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  phone?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  npwp?: string;
}
