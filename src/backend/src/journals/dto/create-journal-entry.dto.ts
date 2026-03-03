import { Transform, Type } from "class-transformer";
import { IsArray, IsDate, IsOptional, IsString, ValidateNested, ArrayMinSize } from "class-validator";
import { JournalLineDto } from "./journal-line.dto";

export class CreateJournalEntryDto {
  @Transform(({ value }) => (value ? new Date(value) : new Date()))
  @IsDate()
  date!: Date;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  memo?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
}
