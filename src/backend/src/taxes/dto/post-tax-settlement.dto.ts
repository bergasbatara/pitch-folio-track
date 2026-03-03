import { Transform } from "class-transformer";
import { IsDate, IsInt, IsOptional, IsString, Min } from "class-validator";

export class PostTaxSettlementDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  amount!: number;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  @IsDate()
  date?: Date;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  memo?: string;
}
