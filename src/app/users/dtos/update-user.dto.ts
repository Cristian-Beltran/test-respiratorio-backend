import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateMyProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  lastname: string;

  @IsString()
  @IsOptional()
  address?: string;
}
