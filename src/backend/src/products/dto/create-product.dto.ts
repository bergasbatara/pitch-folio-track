<<<<<<< HEAD
import { Transform } from "class-transformer";
import { IsInt, IsString, Min } from "class-validator";

export class CreateProductDto {
  @Transform(({ value }) => String(value ?? ""))
  @IsString()
  name: string;

  @Transform(({ value }) => {
    if (typeof value === "string") {
      const normalized = value.replace(/[^\d]/g, "");
=======
import { Transform } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @Transform(({ value }) => String(value ?? ''))
  @IsString()
  name!: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const normalized = value.replace(/[^\d]/g, '');
>>>>>>> 0849f75 (Auth db error)
      return normalized ? Number(normalized) : 0;
    }
    return Number(value);
  })
  @IsInt()
  @Min(0)
<<<<<<< HEAD
  price: number;
=======
  price!: number;
>>>>>>> 0849f75 (Auth db error)

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
<<<<<<< HEAD
  stock: number;
=======
  stock!: number;
>>>>>>> 0849f75 (Auth db error)
}
