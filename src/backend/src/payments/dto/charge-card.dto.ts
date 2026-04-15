import { Transform } from "class-transformer";
import { IsNumber, IsString, Min } from "class-validator";

export class ChargeCardDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  tokenId!: string;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  orderId!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  grossAmount!: number;

  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  planId!: string;
}
