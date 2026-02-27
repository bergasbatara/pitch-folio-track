import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString } from "class-validator";

const STATUS_VALUES = ["active", "cancelled", "expired"] as const;

export class UpdateSubscriptionDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  planId?: string;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsIn(STATUS_VALUES as unknown as string[])
  status?: string;
}
