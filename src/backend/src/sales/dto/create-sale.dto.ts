import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateSaleDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  @IsOptional()
  @IsString()
  productId?: string;

  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    return trimmed ? trimmed.toUpperCase() : undefined;
  })
  @IsOptional()
  @IsString()
  productCode?: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  quantity: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  pricePerUnit: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  soldAt?: Date;
}
