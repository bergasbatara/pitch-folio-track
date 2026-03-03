import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString } from "class-validator";

const TYPE_VALUES = ["asset", "liability", "equity", "revenue", "expense"] as const;
const BALANCE_VALUES = ["debit", "credit"] as const;

export class UpdateAccountDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  code?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  name?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsIn(TYPE_VALUES as unknown as string[])
  type?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsIn(BALANCE_VALUES as unknown as string[])
  normalBalance?: string;
}
