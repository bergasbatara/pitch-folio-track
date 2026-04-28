import { Transform, Type } from "class-transformer";
import { IsDate, IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

const KIND_VALUES = ["liability", "equity"] as const;

export class CreateOpeningBalanceItemDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsIn(KIND_VALUES as unknown as string[])
  kind!: string;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsUUID()
  accountId!: string;

  @Type(() => Date)
  @IsDate()
  asOfDate!: Date;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsPositive()
  amount!: number;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsOptional()
  @IsString()
  memo?: string;
}
