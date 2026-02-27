import { Transform } from "class-transformer";
import { IsString } from "class-validator";

export class CreateSubscriptionDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  planId!: string;
}
