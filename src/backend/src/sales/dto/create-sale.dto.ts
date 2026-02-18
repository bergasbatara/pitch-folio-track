<<<<<<< HEAD
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateSaleDto {
  @Transform(({ value }) => String(value ?? ""))
  @IsString()
  productId: string;
=======
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSaleDto {
  @Transform(({ value }) => String(value ?? ''))
  @IsString()
  productId!: string;
>>>>>>> 0849f75 (Auth db error)

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
<<<<<<< HEAD
  quantity: number;
=======
  quantity!: number;
>>>>>>> 0849f75 (Auth db error)

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
<<<<<<< HEAD
  pricePerUnit: number;
=======
  pricePerUnit!: number;
>>>>>>> 0849f75 (Auth db error)

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  soldAt?: Date;
}
