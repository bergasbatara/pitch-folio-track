import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdatePurchaseDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  @IsOptional()
  @IsString()
  categoryId?: string;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    return String(value);
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  itemName?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  supplier?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  date?: Date;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  notes?: string;
}
