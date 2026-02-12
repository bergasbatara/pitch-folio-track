import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateSaleDto {
  @Transform(({ value }) => String(value ?? ""))
  @IsString()
  productId: string;

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
