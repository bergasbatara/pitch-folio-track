import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateProductDto {
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    return trimmed ? trimmed.toUpperCase() : undefined;
  })
  @IsOptional()
  @IsString()
  code?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
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
  unit?: string;

  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") {
      const normalized = value.replace(/[^\d]/g, "");
      return normalized ? Number(normalized) : 0;
    }
    return Number(value);
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  buyPrice?: number;

  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") {
      const normalized = value.replace(/[^\d]/g, "");
      return normalized ? Number(normalized) : 0;
    }
    return Number(value);
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
