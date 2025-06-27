import { IsString, IsEmail, IsNotEmpty, MaxLength, MinLength, IsBoolean, IsOptional } from 'class-validator';
import { Sanitize } from '../transformers/sanitize.transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Sanitize()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @Sanitize()
  email!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  // @IsString()
  // @IsNotEmpty()
  // @MinLength(8)
  // @MaxLength(100)
  // password!: string;
}