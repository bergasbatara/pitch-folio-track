import { Transform } from "class-transformer";
import { IsDate, IsIn, IsInt, IsString, Min } from "class-validator";

const CATEGORY_VALUES = ["gedung", "kendaraan", "mesin", "tanah", "lainnya"] as const;
const METHOD_VALUES = ["straight_line"] as const;
const TYPE_VALUES = ["tetap", "lancar"] as const;

export class CreateFixedAssetDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  name!: string;

  @Transform(({ value }) => String(value ?? "tetap").trim())
  @IsIn(TYPE_VALUES as unknown as string[])
  assetType!: string;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsIn(CATEGORY_VALUES as unknown as string[])
  category!: string;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  acquisitionDate!: Date;

  @Transform(({ value }) => Number(value))
  @IsInt()
  acquisitionCost!: number;

  @Transform(({ value }) => Number(value ?? 0))
  @IsInt()
  residualValue!: number;

  @Transform(({ value }) => Number(value ?? 0))
  @IsInt()
  @Min(0)
  usefulLifeMonths!: number;

  @Transform(({ value }) => String(value ?? "straight_line").trim())
  @IsIn(METHOD_VALUES as unknown as string[])
  depreciationMethod!: string;
}
