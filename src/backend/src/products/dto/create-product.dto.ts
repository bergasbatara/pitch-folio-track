import { Transform } from "class-transformer";
import { IsInt, IsString, Min } from "class-validator";

export class CreateProductDto {
  @Transform(({ value }) => String(value ?? ""))
  @IsString()
  name: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  price: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  stock: number;
}
