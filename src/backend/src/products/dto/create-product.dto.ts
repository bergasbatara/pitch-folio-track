import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateProductDto {
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    return trimmed ? trimmed.toUpperCase() : undefined;
  })
  @IsOptional()
  @IsString()
  code?: string;

  @Transform(({ value }) => String(value ?? ""))
  @IsString()
  name: string;

  @Transform(({ value }) => {
    if (typeof value === "string") {
      const normalized = value.replace(/[^\d]/g, "");
      return normalized ? Number(normalized) : 0;
    }
    return Number(value);
  })
  @IsInt()
  @Min(0)
  price: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  stock: number;
}
