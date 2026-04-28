import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

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

  @Transform(({ value }) => new Date(String(value)))
  @IsOptional()
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

