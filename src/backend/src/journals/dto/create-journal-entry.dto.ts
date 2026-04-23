import { Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { JournalLineDto } from "./journal-line.dto";

export class CreateJournalEntryDto {
  @Transform(({ value }) => (value ? new Date(value) : new Date()))
  @IsDate()
  date!: Date;

  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  memo?: string;

  // If omitted: backend will auto-pick posted when balanced, otherwise draft.
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  @IsIn(["draft", "posted"])
  status?: "draft" | "posted";

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
}
