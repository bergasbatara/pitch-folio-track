import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateTaxCodeDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  name?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim().toUpperCase()))
  @IsOptional()
  @IsString()
  code?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate?: number;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  description?: string;
}
