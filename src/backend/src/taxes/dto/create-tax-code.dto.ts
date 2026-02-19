import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateTaxCodeDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Transform(({ value }) => String(value ?? "").trim().toUpperCase())
  @IsString()
  @IsNotEmpty()
  code!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(100)
  rate!: number;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  description?: string;
}
