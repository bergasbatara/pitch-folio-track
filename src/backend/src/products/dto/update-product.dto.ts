<<<<<<< HEAD
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
=======
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
>>>>>>> 0849f75 (Auth db error)

export class UpdateProductDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  @IsOptional()
  @IsString()
  name?: string;

  @Transform(({ value }) => {
<<<<<<< HEAD
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") {
      const normalized = value.replace(/[^\d]/g, "");
=======
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      const normalized = value.replace(/[^\d]/g, '');
>>>>>>> 0849f75 (Auth db error)
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
