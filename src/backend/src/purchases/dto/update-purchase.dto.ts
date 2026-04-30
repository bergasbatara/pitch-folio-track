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

  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    return trimmed ? trimmed.toUpperCase() : undefined;
  })
  @IsOptional()
  @IsString()
  productCode?: string;

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
  @Transform(({ value }) => parseDateInput(value))
  date?: Date;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  notes?: string;
}

function parseDateInput(value: unknown): Date | undefined {
  if (!value) return undefined;
  const raw = String(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    return new Date(year, month, day, 12, 0, 0);
  }
  return new Date(raw);
}
