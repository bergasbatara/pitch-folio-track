import { Transform } from "class-transformer";
import { IsIn, IsString } from "class-validator";

const TYPE_VALUES = ["asset", "liability", "equity", "revenue", "expense"] as const;
const BALANCE_VALUES = ["debit", "credit"] as const;

export class CreateAccountDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  code!: string;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  name!: string;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsIn(TYPE_VALUES as unknown as string[])
  type!: string;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsIn(BALANCE_VALUES as unknown as string[])
  normalBalance!: string;
}
