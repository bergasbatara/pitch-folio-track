import { Transform } from "class-transformer";
import { IsDate, IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

const CATEGORY_VALUES = ["gedung", "kendaraan", "mesin", "tanah", "lainnya"] as const;
const METHOD_VALUES = ["straight_line"] as const;
const TYPE_VALUES = ["tetap", "lancar"] as const;

export class UpdateFixedAssetDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  name?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsIn(TYPE_VALUES as unknown as string[])
  assetType?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsIn(CATEGORY_VALUES as unknown as string[])
  category?: string;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  @IsDate()
  acquisitionDate?: Date;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  acquisitionCost?: number;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  residualValue?: number;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  usefulLifeMonths?: number;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsIn(METHOD_VALUES as unknown as string[])
  depreciationMethod?: string;
}
