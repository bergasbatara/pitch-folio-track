import { Transform } from "class-transformer";
import { IsDate, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateReceivableDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  customerName!: string;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  description!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  amount!: number;

  @Transform(({ value }) => (value === undefined || value === null ? 0 : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(0)
  paidAmount?: number;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  dueDate!: Date;
}
