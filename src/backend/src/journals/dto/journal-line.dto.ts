import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class JournalLineDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  accountId!: string;

  @Transform(({ value }) => (value === undefined || value === null ? 0 : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  debit?: number;

  @Transform(({ value }) => (value === undefined || value === null ? 0 : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  credit?: number;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  memo?: string;
}
