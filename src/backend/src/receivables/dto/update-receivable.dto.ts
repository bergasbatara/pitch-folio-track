import { Transform } from "class-transformer";
import { IsDate, IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateReceivableDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  customerName?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  paidAmount?: number;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  @IsDate()
  dueDate?: Date;
}
