<<<<<<< HEAD
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
=======
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
>>>>>>> 0849f75 (Auth db error)

export class UpdateSaleDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  @IsOptional()
  @IsString()
  productId?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerUnit?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  soldAt?: Date;
}
