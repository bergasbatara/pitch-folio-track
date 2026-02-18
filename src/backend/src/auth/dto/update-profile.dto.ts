<<<<<<< HEAD
import { IsOptional, IsString, IsUrl } from "class-validator";
=======
import { IsOptional, IsString, IsUrl } from 'class-validator';
>>>>>>> 0849f75 (Auth db error)

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;
}
