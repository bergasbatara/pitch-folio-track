import { Transform, Type } from "class-transformer";
import { IsDate, IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

const KIND_VALUES = ["liability", "equity"] as const;

export class UpdateOpeningBalanceItemDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsOptional()
  @IsIn(KIND_VALUES as unknown as string[])
  kind?: string;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  asOfDate?: Date;

  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsOptional()
  @IsString()
  memo?: string;
}
