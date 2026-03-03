import { Transform, Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDate, IsOptional, IsString, ValidateNested } from "class-validator";
import { JournalLineDto } from "./journal-line.dto";

export class UpdateJournalEntryDto {
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsOptional()
  @IsDate()
  date?: Date;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines?: JournalLineDto[];
}
