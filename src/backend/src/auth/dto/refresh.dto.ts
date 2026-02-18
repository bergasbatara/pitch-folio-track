<<<<<<< HEAD
import { IsString } from "class-validator";

export class RefreshDto {
  @IsString()
  refreshToken: string;
=======
import { IsString } from 'class-validator';

export class RefreshDto {
  @IsString()
  refreshToken!: string;
>>>>>>> 0849f75 (Auth db error)
}
