import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePurchaseCategoryDto {
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  name?: string;
}
