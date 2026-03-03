import { Transform } from "class-transformer";
import { IsDate, IsOptional } from "class-validator";

export class PostDepreciationDto {
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  @IsDate()
  date?: Date;
}
